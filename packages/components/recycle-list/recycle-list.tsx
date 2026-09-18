/** @jsxImportSource vue */

import {
	defineComponent,
	ref,
	computed,
	onMounted,
	onBeforeMount,
	onBeforeUnmount,
	nextTick,
	watch,
	Fragment,
	getCurrentInstance,
	shallowRef,
	inject
} from 'vue';
import { throttle } from '@deot/helper-utils';
import { Resize } from '@deot/helper-resize';
import { Interrupter } from '@deot/helper-scheduler';
import { props as recycleListProps } from './recycle-list-props';
import { Defer } from '../defer';
import { Customer } from '../customer';
import { ScrollerWheel } from '../scroller';
import { ScrollState } from './scroll-state';
import { Container } from './container';
import { Resizer } from '../resizer';
import { useDirectionKeys } from './hooks/use-direction-keys';
import { useMeasure } from './hooks/use-measure';
import { useRenderer } from './hooks/use-renderer';
import { useScrollLock } from './hooks/use-scroll-lock';
import { useLoadEmitter, useLoadState } from './hooks/use-load-state';
import { Store } from './store';
import type { RecycleListItemNodeRaw, ScrollLeaf } from './store';
import { Viewport } from './viewport';

const isTouch = typeof document !== 'undefined' && 'ontouchend' in document;
const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize', 'load-change'],
	setup(props, { slots, expose, emit }) {
		const instance = getCurrentInstance()!;
		const leaf = instance as unknown as ScrollLeaf;
		const injectedScroller = inject<any>('vc-scroller', undefined);
		const store = props.store || new Store(props);
		const K = useDirectionKeys();
		const isMounted = ref(false);

		// ---------------------------------------------------------------------
		// 元素引用
		// ---------------------------------------------------------------------
		const scroller = shallowRef();
		const content = shallowRef();
		const wrapper = computed(() => scroller.value?.wrapper);
		const getRoot = () => instance.vnode.el as HTMLElement | undefined;

		// ---------------------------------------------------------------------
		// 渲染与测量
		// ---------------------------------------------------------------------

		// 加载状态：lazyTail、ScrollState、load-change 共用
		const loadState = useLoadState(props, store);

		const { renderer, hasPlaceholder, renderEdgeSlot } = useRenderer(props, slots, store, loadState);
		const { placeholder, trackVisible, trackPooled, isPooled, measure, remeasureVisible } = useMeasure(store, K, hasPlaceholder);

		// fill=false 时主轴交给外部承载者：内部 wrapper 沿主轴随内容展开，不能再被 scrollerOptions 限高/限宽
		const resolvedScrollerOptions = computed(() => {
			const source: any = props.scrollerOptions || {};
			if (props.fill) return source;
			const mainStyle = props.vertical
				? { height: 'auto', maxHeight: 'none' }
				: { width: 'max-content' };
			return {
				...source,
				...(props.vertical ? { height: '', maxHeight: '' } : {}),
				wrapperStyle: [source.wrapperStyle, mainStyle]
			};
		});

		// ---------------------------------------------------------------------
		// 滚动源：fill=true 为内部 ScrollerWheel，fill=false 为外部承载者
		// ---------------------------------------------------------------------

		// 最近一次有效的视口尺寸；元素被隐藏（clientSize 读到 0）时作为兜底
		let lastClientSize = 0;
		const viewport = new Viewport(
			{
				root: getRoot,
				wrapper: () => wrapper.value,
				content: () => content.value,
				contentSize: () => store.states.contentMaxSize,
				fallbackClientSize: () => lastClientSize
			},
			{
				onScroll: () => handleExternalScroll(),
				onResize: () => handleViewportResize()
			},
			K
		);

		// 程序化滚动期间屏蔽滚动处理，避免误触发 loadData / 广播
		const { isLocked, lock, unlock } = useScrollLock();

		const hasRealNodes = () => store.nodes.real.size > 0;

		// ---------------------------------------------------------------------
		// 可见范围
		// ---------------------------------------------------------------------
		const setVisibleItemRange = () => {
			const state = viewport.state();
			if (!state) return;
			const overscan = Math.max(0, props.overscan);
			// 换算到 content 坐标系（item.position 的原点）
			store.position.updateVisibleRange(
				state.viewportStart - state.contentStart - overscan,
				state.viewportEnd - state.contentStart + overscan
			);
		};

		/**
		 * 几何缓存失效后重算可见范围
		 * @param settle 外部滚动源下额外等一次 patch 再算：本 tick 内 DOM 尺寸可能还没更新
		 */
		const syncVisibleRange = async (settle = false) => {
			viewport.invalidate();
			setVisibleItemRange();
			if (!settle || !viewport.deferred) return;
			const rebound = viewport.mark();
			await nextTick();
			// 期间卸载、切回 fill 或重新绑定了滚动源，则放弃这次补算
			if (!isMounted.value || props.fill || rebound()) return;
			viewport.invalidate();
			setVisibleItemRange();
		};

		// 是否滚动到接近触发加载的边缘（inverted 为列表头部，否则为尾部）
		const isNearLoadEdge = () => {
			const state = viewport.state();
			if (!state) return false;
			const { threshold } = props;
			// 外部滚动源里列表只是页面的一段：视口尚未与列表相交时不加载
			if (!viewport.intersects(state, threshold)) return false;
			if (store.props.inverted) {
				return state.viewportStart - threshold <= state.listStart;
			}
			// 距尾部阈值线的剩余距离；两种滚动源的边界判定松紧不同
			const remain = state.listEnd - threshold - state.viewportEnd;
			return viewport.reachedEnd(remain);
		};

		// 内容是否不足一屏：不足时无法通过滚动触发加载，需要主动继续
		const isContentUnderfilled = () => {
			const size = viewport.fillSize;
			return store.states.contentMaxSize > 0
				&& store.states.contentMaxSize <= size;
		};

		/**
		 * 一批加载完成时视口是否仍停在加载边缘
		 *
		 * 例如请求返回前已滚到底，或骨架被等高内容替换后位置不变：此后不会再有滚动事件触发加载，需要主动续载。
		 * 列表不可见时（wrapper 尺寸为 0）不续载：此时几何全为 0，贴边判断恒为真，会在后台把数据一次拉完；
		 * 不用 viewport.clientSize 判断可见性，因为内部滚动源读到 0 时会回退到上一次的有效尺寸
		 * @returns 是否仍停在加载边缘
		 */
		const isStillAtLoadEdge = () => {
			const el = wrapper.value;
			return !!el
				&& el.offsetWidth > 0
				&& el.offsetHeight > 0
				&& store.states.contentMaxSize > 0
				&& isNearLoadEdge();
		};

		// ---------------------------------------------------------------------
		// 滚动
		// ---------------------------------------------------------------------
		/**
		 * 滚动到指定位置
		 * @param options 数字视为主轴位置；对象为 { x, y }，缺省轴归零
		 * @param force 相同值也写入
		 */
		const scrollTo = (options: any, force?: boolean) => {
			const target = { x: 0, y: 0 };
			if (typeof options === 'number') {
				target[K.axis] = options;
			} else if (typeof options === 'object') {
				Object.assign(target, options);
			}

			const el = wrapper.value;
			if (!el) return;

			if (!viewport.external) {
				(force || el.scrollLeft !== target.x) && (el.scrollLeft = target.x);
				(force || el.scrollTop !== target.y) && (el.scrollTop = target.y);
				scroller.value.scrollTo(target);
				return;
			}

			// 外部滚动源：交叉轴仍在内部 wrapper 上，主轴交给承载者
			const cross = target[K.crossAxis];
			(force || el[K.crossScrollAxis] !== cross) && (el[K.crossScrollAxis] = cross);
			viewport.scrollTo(target[K.axis], force);
			scroller.value.scrollTo({ [K.crossAxis]: cross });
		};

		/**
		 * 滚动到第 index 项；交叉轴归零
		 * @param index 数据索引（rebuildData 下标）
		 * @param offset 额外偏移
		 */
		const scrollToIndex = (index: number, offset = 0) => {
			const item = store.states.rebuildData[index];
			if (!(item?.states.position >= 0)) return;
			const state = viewport.state();
			if (!state) return;
			// item.position 以 content 为原点；外部滚动源需换算到承载者坐标
			const base = viewport.contentOrigin(state);
			scrollTo({ [K.axis]: base + item.states.position + offset, [K.crossAxis]: 0 });
		};

		/**
		 * 外部滚动源 + inverted：把视口贴到列表尾部（首屏展示最新内容）
		 */
		const alignToListEnd = () => {
			const state = viewport.state();
			if (!state) return;
			viewport.scrollTo(Math.max(0, state.listEnd - state.clientSize));
		};

		// ---------------------------------------------------------------------
		// 布局
		// ---------------------------------------------------------------------

		// 进行中的 layoutRange 数量：会并发（例如分批构建期间替换数据），归零才算全部结束
		let runningLayouts = 0;
		const layoutInterrupter = Interrupter.of();
		/**
		 * 隐藏池是否同步渲染待测节点
		 *
		 * 待测集合里有测量过的节点，说明已经展示过的行被重置了（数据替换、尺寸变化后的整体重排）：
		 * 它们测完之前不会出现在列中，必须在同一个任务里渲染、测量并排版，否则会先白屏再逐片出现。
		 * 全是从未测量过的新节点（如按批懒构建的下一批）时才分片，避免整批在一个任务里渲染
		 */
		const isPoolSync = computed(() => store.states.preData.some(node => node.measured));
		/**
		 * 隐藏池每渲染完一片就放行一次等待中的测量
		 *
		 * 待测集合每次变化 Defer 都会重新渲染一轮（once=false），因此用 next 反复放行；
		 * progress 与 complete 接同一个处理：整轮没有任何分片可提交时只有 complete，不能漏掉放行
		 */
		const deferInterrupter = Interrupter.of();
		const handlePoolRendered = () => deferInterrupter.next();

		/**
		 * 隐藏池的数据：一波构建里只增不减，没有待测节点时整批清空
		 *
		 * 待测集合是「尚未测量」的节点，测完一批它就少掉一截前缀；直接拿它当池的数据，
		 * Defer 已渲染的前缀会整体作废，还在排队的下一批被卸载后又重新渲染一遍。
		 * 改成追加后，已测量的节点留在池里直到这一波结束，下一批始终是已渲染前缀的延续
		 */
		let poolNodes: RecycleListItemNodeRaw[] = [];
		const poolData = computed(() => {
			const pending = store.states.preData;
			if (!pending.length) {
				poolNodes = poolNodes.length ? [] : poolNodes;
				return poolNodes;
			}
			const known = new Set(poolNodes);
			const added = pending.filter(node => !known.has(node));
			if (added.length) poolNodes = poolNodes.concat(added);
			return poolNodes;
		});

		/**
		 * 构建 [start, end) 区间的节点，测量后重排并刷新可见范围
		 * @param start 区间起点（含）
		 * @param end 区间终点（不含）
		 * @param options 构建选项，透传给 nodes.build
		 * @param options.reversed inverted 本地翻页时逆序补建更早的数据
		 * @param options.force 已测量的节点也重新构建，用于整体重测
		 */
		const layoutRange = async (start: number, end: number, options: { reversed?: boolean; force?: boolean } = {}) => {
			if (start === end) {
				store.states.isBuilt = !store.local.hasMore;
				syncVisibleRange();
				return;
			}
			runningLayouts++;
			const nodes = store.nodes.build(start, end, options);
			// 只等自己这批节点进隐藏池：并发构建（挂载时的首批与懒构建的下一批）不该互相拖住，
			// 谁的节点先进池谁先排版。尺寸一直读到 0 的节点已经在池里，条件为假不会空等；
			// 骨架占位不进待测集合，同样不必等
			while (nodes.some(node => store.nodes.pending.has(node) && !isPooled(node))) {
				await deferInterrupter;
			}
			await nextTick();
			const measured = nodes
				.map(measure)
				.filter(Boolean) as RecycleListItemNodeRaw[];
			store.layout.refresh();

			// 外部滚动源的边界依赖真实 DOM 尺寸，等 patch 完成后再量
			await viewport.settle();
			viewport.invalidate();

			if (!hasRealNodes()) {
				// 只有占位时全部展示，骨架撑起首屏
				store.states.firstItemIndex = 0;
				store.states.lastItemIndex = store.states.rebuildData.length - 1;
			} else {
				setVisibleItemRange();
			}
			measured.length > 0 && emit(
				'row-resize',
				measured.map(node => ({ size: node.states.size, index: node.states.index }))
			);

			// 布局结束时按当时的实际状态写入：重排期间保持原值，数据整体替换时尾部不会闪
			store.states.isBuilt = !store.local.hasMore;

			// 仍有并发的布局时不放行等待者
			if (--runningLayouts === 0) layoutInterrupter.next();
		};

		// 整体重新测量已构建的节点并重排
		const refreshLayout = async () => {
			viewport.invalidate();
			const [start, end] = store.local.builtRange;
			await layoutRange(start, end, { force: true });
		};

		// ---------------------------------------------------------------------
		// inverted 滚动补偿
		// ---------------------------------------------------------------------

		// 外部滚动源下是否已把初始内容贴到列表尾部
		let invertedAligned = false;

		/**
		 * 外部滚动源 + inverted 首次拿到有尺寸的真实内容后贴底一次
		 * 原 alignExternalInverted
		 */
		const alignInvertedOnce = async () => {
			if (
				!viewport.external
				|| !store.props.inverted
				|| invertedAligned
				|| store.states.contentMaxSize <= 0
				|| !hasRealNodes()
			) return;

			const rebound = viewport.mark();
			invertedAligned = true;
			await nextTick();
			if (
				!isMounted.value
				|| rebound()
				|| props.fill
				|| !store.props.inverted
			) return;

			viewport.invalidate();
			lock();
			alignToListEnd();
			setVisibleItemRange();
			unlock();
		};

		// 数据 load 前的主轴滚动位置，用于判断请求期间用户是否滚动过
		let originalScrollPosition = 0;

		/**
		 * inverted 下补建的内容会向上撑开：构建期间锁定滚动，结束后补偿滚动距离保持视口不跳动
		 * @param start 区间起点
		 * @param end 区间终点
		 * @param options 补偿选项
		 * @param options.reversed 逆序补建
		 * @param options.originalSize 构建前的内容尺寸，缺省取当前值
		 * @param options.offset 构建后额外叠加的主轴偏移
		 */
		const layoutInvertedRange = async (
			start: number,
			end: number,
			options: { reversed?: boolean; originalSize?: number; offset?: () => number } = {}
		) => {
			lock();
			const originalSize = options.originalSize ?? store.states.contentMaxSize;
			const originalOffset = viewport.offset;
			const originalContentStart = viewport.state()?.contentStart || 0;
			await layoutRange(start, end, { reversed: options.reversed });
			const delta = store.states.contentMaxSize - originalSize;

			if (!viewport.external) {
				viewport.scrollTo(delta + (options.offset?.() || 0));
			} else {
				const state = viewport.state()!;
				// 首屏（原尺寸为 0）直接贴底；否则在原位置上叠加内容增量与 content 起点的平移
				const target = originalSize === 0
					? state.listEnd - state.clientSize
					: (options.offset?.() ?? originalOffset)
						+ delta
						+ state.contentStart
						- originalContentStart;
				viewport.scrollTo(Math.max(0, target));
				if (originalSize === 0 && hasRealNodes()) {
					invertedAligned = true;
				}
			}
			setVisibleItemRange();
			unlock();
		};

		/**
		 * 远程分页落地后的布局刷新
		 * @param current 第 N 次请求（从 1 开始）
		 * @param start 区间起点
		 * @param end 区间终点
		 */
		const layoutPage = async (current: number, start: number, end: number) => {
			if (!store.props.inverted) {
				await layoutRange(start, end);
				return;
			}

			await layoutInvertedRange(start, end, {
				originalSize: current === 1 ? 0 : store.states.contentMaxSize,
				offset: () => {
					if (current === 1) return 0;
					const offset = viewport.offset;
					if (viewport.external) return offset;
					// 内部滚动源：请求期间用户滚动过才保留当前位置，否则只补内容增量
					return offset !== originalScrollPosition ? offset : 0;
				}
			});
		};

		// ---------------------------------------------------------------------
		// 数据加载
		// ---------------------------------------------------------------------

		// 本地数据(data)按 batchCount 懒构建下一批
		let isBuildingLocal = false;
		const buildLocalPage = async () => {
			if (isBuildingLocal || !store.local.hasMore) return false;
			isBuildingLocal = true;
			const { start, end, reversed } = store.local.consumePage()!;
			reversed
				? await layoutInvertedRange(start, end, {
						reversed,
						offset: () => viewport.offset
					})
				: await layoutRange(start, end);
			isBuildingLocal = false;
			return true;
		};

		const stopScroll = () => {
			store.stop();
			syncVisibleRange(true);
		};

		/**
		 * 请求期间先渲染一批骨架占位
		 *
		 * inverted 下占位在头部撑开，需要补偿滚动保持视口不动；外部滚动源的首屏占位则贴底
		 */
		const allocatePlaceholders = async () => {
			const { start, end } = store.nodes.allocatePlaceholders();
			const originalSize = store.states.contentMaxSize;
			await layoutRange(start, end);
			if (!store.props.inverted) return;

			lock();
			const position = store.states.contentMaxSize - originalSize + originalScrollPosition;
			if (viewport.external && originalSize === 0) {
				const rebound = viewport.mark();
				await nextTick();
				if (!props.fill && !rebound()) {
					viewport.invalidate();
					alignToListEnd();
				}
			} else {
				viewport.scrollTo(position);
			}
			if (hasRealNodes()) {
				setVisibleItemRange();
			}
			unlock();
		};

		const loadRemoteData = async (onBeforeCommit?: () => void) => {
			const { current, response, start, end } = await store.fetchPage(onBeforeCommit);
			if (!response || !response.data) {
				stopScroll();
				return;
			}
			await layoutPage(current, start, end);

			// 响应条数少于预分配的占位时，回收多余骨架，避免后续 id 漂移
			if (store.nodes.trimPlaceholders()) {
				store.layout.refresh();
				await syncVisibleRange(true);
			}

			if (response.finished) {
				stopScroll();
			}
		};

		/**
		 * 加载下一批：本地未构建完先懒构建，否则请求远程
		 * @param onBeforeCommit 存在说明是刷新流程（reset silent），直接走远程；响应到达后、写入前调用
		 */
		const loadData = async (onBeforeCommit?: () => void) => {
			if (store.states.isSilentRefresh) return;
			let canContinue: boolean;

			// 本地数据已在手上，懒构建不受 disabled / isEnd 约束
			if (!onBeforeCommit && store.local.hasMore) {
				canContinue = await buildLocalPage();
			} else {
				if (props.disabled || store.states.isEnd || store.states.isLoading) return;
				originalScrollPosition = viewport.offset;
				if (hasPlaceholder.value) {
					await allocatePlaceholders();
				}
				await loadRemoteData(onBeforeCommit);
				canContinue = !store.states.isEnd;
			}

			// 本次构建/加载完成后，内容不足一屏或视口仍停在加载边缘时，继续处理下一批
			if (canContinue && (isContentUnderfilled() || isStillAtLoadEdge())) {
				loadData();
			}
		};

		/**
		 * 重置并重新加载
		 * @param silent 为 true 时保留旧内容直到新数据到达（下拉刷新）
		 */
		const reset = async (silent = false) => {
			store.reset();
			viewport.scrollTo(0);

			const done = () => store.clear();
			if (!silent) {
				done();
				await loadData();
			} else {
				const next = loadData(done);
				store.states.isSilentRefresh = true;
				await next;
			}
		};

		// 触发下拉刷新
		const handleRefresh = async () => {
			await reset(true);
		};

		// 只有主轴停在起点时才允许下拉
		const canPull = () => viewport.offset === 0;

		// ---------------------------------------------------------------------
		// 事件
		// ---------------------------------------------------------------------
		/**
		 * 滚动处理；只有当前主动滚动的实例（currentLeaf）响应，其它共享 store 的实例只接收广播
		 * @param e FakeUIEvent，避免读取 DOM 属性，该值是提前计算出来的
		 */
		const handleScroll = (e: any) => {
			if (store.scroll.currentLeaf !== leaf || isLocked()) return;

			isNearLoadEdge() && loadData();
			setVisibleItemRange();
			store.scroll.broadcast(e);
			emit('scroll', e);
		};

		// 内部 ScrollerWheel 的滚动：外部滚动源下换成合并了主轴与交叉轴的假事件
		const handleInnerScroll = (e: any) => {
			handleScroll(viewport.createScrollEvent() ?? e);
		};

		const handleExternalScroll = () => {
			const e = viewport.createScrollEvent();
			e && handleScroll(e);
		};

		/**
		 * 滚动补偿的锚点：渲染范围内第一个起点不早于视口起点的项，找不到时取首个渲染项
		 *
		 * 首个渲染项常在视口上方的 overscan 区：它自身变高时位置不变，视口里的内容却被推走，拿它当锚点就补偿不到
		 * @returns 锚点在 rebuildData 中的下标
		 */
		const getAnchorIndex = () => {
			const { firstItemIndex, lastItemIndex, rebuildData } = store.states;
			viewport.invalidate();
			const state = viewport.state();
			if (!state) return firstItemIndex;
			const start = state.viewportStart - state.contentStart;
			for (let i = firstItemIndex; i <= lastItemIndex; i++) {
				const position = rebuildData[i]?.states.position;
				if (typeof position === 'number' && position >= start) return i;
			}
			return firstItemIndex;
		};

		/**
		 * 执行会改变布局的操作，并按锚点的位移补偿滚动，画面保持不动
		 * @param update 改变布局的操作
		 */
		const preserveAnchor = async (update: () => unknown) => {
			const anchorIndex = getAnchorIndex();
			const oldPosition = store.states.rebuildData[anchorIndex]?.states.position;
			await update();
			const newPosition = store.states.rebuildData[anchorIndex]?.states.position;

			// item 尚未完成初始定位（position = -1000）时不补偿
			if (typeof oldPosition === 'number' && oldPosition >= 0 && typeof newPosition === 'number') {
				viewport.scrollTo(viewport.offset + (newPosition - oldPosition));
			}
		};

		// 列表交叉轴尺寸变化会改变所有节点的尺寸：节流结束后整体重排并保持首个可见项不跳动
		const handleResize = throttle(async () => {
			if (!wrapper.value) return;
			const state = viewport.state();
			lastClientSize = state?.clientSize || wrapper.value[K.clientSize];
			viewport.invalidate();
			if (!hasRealNodes()) return;

			await preserveAnchor(refreshLayout);
		}, 50, {
			leading: false,
			trailing: true
		});

		/**
		 * 行的实测尺寸与记录不一致时只修正这些行（增量重排，不重建节点）
		 *
		 * 两种来源：行渲染出来时的首次测量（如在原对象上改了视口外某行影响尺寸的字段，渲染出来才能读到真实尺寸），
		 * 以及已渲染的行自身内容变化（展开、编辑、图片撑开等）。
		 * 同一个微任务内的变化合并处理，只重排一次；变化的行在锚点之前时补偿滚动
		 */
		const renderedRows = new Set<RecycleListItemNodeRaw>();
		const correctRenderedRows = async () => {
			while (runningLayouts > 0) {
				await layoutInterrupter;
			}
			const nodes = [...renderedRows];
			renderedRows.clear();
			if (!isMounted.value) return;

			const changed = nodes
				.map(remeasureVisible)
				.filter(Boolean) as RecycleListItemNodeRaw[];
			// 常见情况是尺寸一致，什么都不做（也不写滚动位置）
			if (!changed.length) return;

			// 写回尺寸不改位置，锚点的原位置在重排前读取仍然有效
			await preserveAnchor(() => store.layout.refresh());
			syncVisibleRange();
			emit('row-resize', changed.map(node => ({ size: node.states.size, index: node.states.index })));
		};

		/**
		 * 行尺寸变化（Resizer 首次测量或内容变化）时登记，留待同一个微任务内统一校正
		 * @param node 尺寸变化的节点
		 */
		const handleRowResize = (node: RecycleListItemNodeRaw) => {
			renderedRows.size === 0 && Promise.resolve().then(correctRenderedRows);
			renderedRows.add(node);
		};

		/**
		 * 刷新视口几何与可见范围，并按已渲染行的实际尺寸校正一次
		 *
		 * 代价只与当前渲染的行数相关；要重新测量全部已构建的行时用 refreshLayout()
		 */
		const refreshViewport = async () => {
			scroller.value?.refresh?.();
			store.states.data.flat().forEach(handleRowResize);
			await syncVisibleRange(true);
		};

		/**
		 * 列表 wrapper 自身尺寸变化
		 *
		 * 节点尺寸只受交叉轴（纵向列表为宽度）影响，主轴尺寸变化不会改变任何节点的大小。
		 * fill=false 时 wrapper 沿主轴随内容增长，每构建一批都会触发这里；若每次都全量重测，
		 * 就要把所有已构建节点重新放进隐藏池渲染一遍，代价随已构建数量线性增长。
		 * 因此交叉轴未变时只刷新几何缓存与可见范围；首次回调与交叉轴变化时仍走全量重测
		 */
		let lastCrossSize = -1;
		const handleWrapperResize = () => {
			const el = wrapper.value;
			if (!el) return;
			const crossSize = el[K.crossClientSize];
			if (crossSize !== lastCrossSize) {
				lastCrossSize = crossSize;
				handleResize();
				return;
			}
			lastClientSize = viewport.state()?.clientSize || el[K.clientSize];
			viewport.invalidate();
			setVisibleItemRange();
		};

		/**
		 * 外部承载者尺寸变化
		 *
		 * 只影响视口几何，不影响节点尺寸：节点尺寸取决于列表自身的交叉轴，由 handleWrapperResize 负责
		 */
		const handleViewportResize = () => {
			viewport.invalidate();
			lastClientSize = viewport.clientSize;
			setVisibleItemRange();
			isContentUnderfilled() && loadData();
		};

		/**
		 * 按当前 fill 重建滚动源；挂载、fill / vertical 变化时调用
		 * 原 bindExternalViewport / unbindExternalViewport
		 */
		const rebindViewport = () => {
			invertedAligned = false;
			// 换轴/换承载者后旧的兜底尺寸不再可信
			lastClientSize = 0;
			viewport.rebind(!props.fill, getRoot(), injectedScroller);
			if (!viewport.external) return;

			// 主轴交给外部承载者后，内部 wrapper 的主轴归零，避免残留偏移叠加到位置计算
			wrapper.value && (wrapper.value[K.scrollAxis] = 0);
			lastClientSize = viewport.clientSize;
			setVisibleItemRange();
			alignInvertedOnce();
		};

		// 设置初始数据（模拟分页，只构建已构建区间，剩余部分随滚动构建）
		const setDataSource = async (v: any, oldV: any) => {
			if (!Array.isArray(v) || oldV === v) return;

			if (!store.setData(v)) return;

			await layoutRange(...store.local.builtRange);
			await alignInvertedOnce();

			// 追加数据时若已停在加载阈值内（如列表底部），无需再滚动即继续构建
			wrapper.value && store.local.hasMore && isNearLoadEdge() && loadData();
		};

		/**
		 * 方向变化后按新方向重建列表
		 *
		 * 本地数据与远程分页在 inverted 下的排列方式不同，无法原地翻转：保留 data 属性按新方向重建，
		 * 已请求的远程页丢弃并从第 1 页重新请求
		 */
		const rebuildDirection = async () => {
			if (!isMounted.value) return;
			lock();
			store.reset();
			store.clear();
			// 同一个 data 数组也要能重新构建
			store.local.source = null;
			invertedAligned = false;
			viewport.scrollTo(0);
			unlock();

			await setDataSource(props.data, undefined);
			await loadData();
		};

		const handleStoreLeafChange = () => {
			store.scroll.currentLeaf = leaf;
		};

		// ---------------------------------------------------------------------
		// 生命周期
		// ---------------------------------------------------------------------
		onBeforeMount(() => {
			store.scroll.add(leaf);
		});

		const moveEventName = isTouch ? 'touchstart' : 'mouseenter';
		onMounted(() => {
			Resize.on(wrapper.value, handleWrapperResize);
			rebindViewport();
			loadData();
			isMounted.value = true;
			wrapper.value.addEventListener(moveEventName, handleStoreLeafChange);
		});

		onBeforeUnmount(() => {
			isMounted.value = false;
			viewport.unbind();
			Resize.off(wrapper.value, handleWrapperResize);
			store.scroll.remove(leaf);
			wrapper.value.removeEventListener(moveEventName, handleStoreLeafChange);
		});

		watch(
			() => props.data,
			setDataSource,
			{ immediate: true }
		);

		watch(
			() => [props.fill, props.vertical],
			async () => {
				if (!isMounted.value) return;
				await nextTick();
				if (!isMounted.value) return;
				rebindViewport();
				await refreshLayout();
			},
			{ flush: 'post' }
		);

		// 组件自建 store 时，被 store 接管的属性随组件属性同步；传入共享 store 时以 store.props 为准
		if (!props.store) {
			watch(
				() => [props.batchCount, props.bufferCount, props.loadData],
				() => {
					const { batchCount, bufferCount, loadData: load } = props;
					store.syncProps({ batchCount, bufferCount, loadData: load });
				}
			);

			// 列数 / 列间距变化会改变列宽，行高要重新测量
			watch(
				() => [props.cols, props.gutter],
				async () => {
					store.syncProps({ cols: props.cols, gutter: props.gutter });
					if (!isMounted.value) return;
					await nextTick();
					isMounted.value && refreshLayout();
				}
			);

			watch(
				() => props.inverted,
				(v) => {
					store.syncProps({ inverted: v });
					rebuildDirection();
				}
			);
		}

		// 从禁用切回启用时，只有内容为空或不足一屏才自动加载
		watch(
			() => props.disabled,
			async (v, oldV) => {
				if (!isMounted.value || oldV !== true || v !== false) return;
				while (runningLayouts > 0) {
					await layoutInterrupter;
				}
				if (!isMounted.value) return;
				if (store.states.contentMaxSize === 0 || isContentUnderfilled()) {
					loadData();
				}
			}
		);

		// 加载状态快照，单向对外
		useLoadEmitter(loadState, emit);

		expose({
			scroller,
			store,
			hasPlaceholder,
			renderer,
			// methods
			reset,
			scrollTo,
			scrollToIndex,
			refreshViewport,
			refreshLayout
		});

		// ---------------------------------------------------------------------
		// 渲染
		// ---------------------------------------------------------------------
		const renderPlaceholder = () => {
			return slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />));
		};

		// ScrollState 自身没有数据来源，状态与 loading / complete / empty 三个 slot 都由外层传入
		const renderScrollState = () => (
			<ScrollState
				loadState={loadState}
				disabled={props.disabled}
				hasPlaceholder={!!hasPlaceholder.value}
				renderer={renderer.value}
			>
				{{
					loading: slots.loading,
					complete: slots.complete,
					empty: slots.empty
				}}
			</ScrollState>
		);

		const renderItem = (item: RecycleListItemNodeRaw) => (
			<Fragment key={item.id}>
				{
					item.states.isPlaceholder && hasPlaceholder.value && (
						<div>{ renderPlaceholder() }</div>
					)
				}
				{
					!item.states.isPlaceholder && (
						<Resizer
							ref={v => trackVisible(item, v)}
							fill={false}
							// 单行尺寸变化只校正该行；交叉轴变化引起的整体变化由 handleWrapperResize 负责
							// @ts-ignore
							onResize={() => handleRowResize(item)}
						>
							{ slots.default?.({ row: item.states.data || {}, index: item.states.index }) }
						</Resizer>
					)
				}
			</Fragment>
		);

		// 每列一个容器，用 translate 定位到该列首个可见项的位置；列内元素按流式排布
		const renderColumn = (column: { index: number; offset: number[] }, columnIndex: number) => (
			<Fragment key={columnIndex}>
				<div
					style={{
						[K.columnSize]: store.states.columnSize,
						[K.paddingColumnHead]: `${column.offset[0]}px`,
						[K.paddingColumnTail]: `${column.offset[1]}px`,
						transform: `${K.translateAxis}(${store.states.data[columnIndex][0]?.states.position || 0}px)`
					}}
					class={[{ 'is-inverted': store.props.inverted }, 'vc-recycle-list__column']}
				>
					{ store.props.inverted && (<div style={{ height: `${store.states.columnFillSize[columnIndex]}px` }} />) }
					{ store.states.data[columnIndex].map(renderItem) }
				</div>
				{ !props.vertical && columnIndex < store.props.cols - 1 && (<br />) }
			</Fragment>
		);

		// 隐藏测量池：待测量节点与骨架在这里先渲染一次以读取真实尺寸
		const renderPool = () => (
			<div
				class="vc-recycle-list__pool"
				style={{ [K.columnSize]: store.states.columnSize, [K.paddingColumnHead]: `${store.states.columnOffsetGutter}px` }}
			>
				<Defer
					data={poolData.value}
					once={false}
					disabled={isPoolSync.value}
					onProgress={handlePoolRendered}
					onComplete={handlePoolRendered}
				>
					{{
						default: ({ row: item }) => (
							<div
								ref={v => trackPooled(item, v)}
								class="vc-recycle-list__hidden"
							>
								{ slots.default?.({ row: item.states.data || {}, index: item.states.index }) }
							</div>
						)
					}}
				</Defer>
				<div ref={placeholder} class="vc-recycle-list__hidden">
					{ renderPlaceholder() }
				</div>
			</div>
		);

		return () => (
			<Container
				class={['vc-recycle-list', {
					'is-horizontal': !props.vertical,
					'is-external': !props.fill,
					'is-inverted': store.props.inverted
				}]}
				pullable={props.pullable}
				inverted={store.props.inverted}
				vertical={props.vertical}
				canPull={canPull}
				render={renderer.value.refresh}
				onRefresh={handleRefresh}
			>
				<ScrollerWheel
					ref={scroller}
					class="vc-recycle-list__wrapper"
					{
						...resolvedScrollerOptions.value
					}
					onScroll={handleInnerScroll}
				>
					{ store.props.inverted && renderScrollState() }
					{ renderEdgeSlot('header') }
					<div
						ref={content}
						class="vc-recycle-list__content"
						style={{ [K.contentSize]: store.states.contentMaxSize + 'px' }}
					>
						{ store.states.columns.map(renderColumn) }
						{ renderPool() }
					</div>
					{ renderEdgeSlot('footer') }
					{ !store.props.inverted && renderScrollState() }
				</ScrollerWheel>
			</Container>
		);
	}
});
