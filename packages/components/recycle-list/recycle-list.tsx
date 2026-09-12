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
import { throttle, getUid } from '@deot/helper-utils';
import { Resize } from '@deot/helper-resize';
import { Interrupter } from '@deot/helper-scheduler';
import { props as recycleListProps } from './recycle-list-props';
import { VcInstance } from '../vc';
import { Defer } from '../defer';
import { Customer } from '../customer';
import { ScrollerWheel } from '../scroller';
import { ScrollState } from './scroll-state';
import { Container } from './container';
import { Resizer } from '../resizer';
import { useDirectionKeys } from './use-direction-keys';
import { Store } from './store';
import type { RecycleListItemNodeRaw, ScrollLeaf } from './store';
import { createViewport } from './viewport';
import type { Viewport, ViewportAnchors, ViewportHandlers } from './viewport';

const isTouch = typeof document !== 'undefined' && 'ontouchend' in document;
const COMPONENT_NAME = 'vc-recycle-list';

/**
 * 程序化滚动后继续屏蔽 handleScroll 的时长（约一帧），
 * 覆盖浏览器异步派发的原生 scroll 事件，避免误触发 loadData / 广播
 */
const SCROLL_LOCK_MS = 16.7;

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize'],
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
		const placeholder = shallowRef();
		const scroller = shallowRef();
		const content = shallowRef();
		const scrollState = shallowRef();
		const wrapper = computed(() => scroller.value?.wrapper);
		const getRoot = () => instance.vnode.el as HTMLElement | undefined;

		// 已渲染项 / 隐藏测量池中的元素，按数据索引存放；
		// 仅供测量读取，不参与渲染，因此不需要响应式；卸载时删除避免无限堆积
		const visibleEls: Record<number, any> = {};
		const pooledEls: Record<number, any> = {};
		const trackEl = (target: Record<number, any>, index: number, el: any) => {
			if (el) {
				target[index] = el;
			} else {
				delete target[index];
			}
		};

		// ---------------------------------------------------------------------
		// 渲染器与派生配置
		// ---------------------------------------------------------------------
		const renderer = computed(() => {
			const globalProps = VcInstance.options?.RecycleList || {};
			return {
				refresh: props.renderRefresh || globalProps.renderRefresh,
				placeholder: props.renderPlaceholder || globalProps.renderPlaceholder,
				loading: props.renderLoading || globalProps.renderLoading,
				complete: props.renderComplete || globalProps.renderComplete,
				empty: props.renderEmpty || globalProps.renderEmpty
			};
		});

		const hasPlaceholder = computed(() => {
			return !!slots.placeholder || renderer.value.placeholder;
		});

		// 骨架 DOM 的实际尺寸，作为测量兜底
		const placeholderFallbackSize = computed(() => {
			if (!hasPlaceholder.value) return 0;
			return placeholder.value[K.offsetSize];
		});

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
		const anchors: ViewportAnchors = {
			root: getRoot,
			wrapper: () => wrapper.value,
			content: () => content.value,
			contentSize: () => store.states.contentMaxSize,
			fallbackClientSize: () => lastClientSize
		};
		const handlers: ViewportHandlers = {
			onScroll: () => handleExternalScroll(),
			onResize: () => handleViewportResize()
		};
		let viewport: Viewport = createViewport({ external: false, keys: K, anchors, handlers });

		/**
		 * 程序化滚动锁：lock 后 handleScroll 忽略滚动事件，unlock 在一帧后才真正释放
		 * 原 isManualScroll = 1 / setTimeout(() => (isManualScroll = 0), 16.7)
		 */
		let isManualScroll = false;
		let unlockTimer: ReturnType<typeof setTimeout> | undefined;
		const lockScroll = () => {
			clearTimeout(unlockTimer);
			isManualScroll = true;
		};
		const unlockScroll = () => {
			clearTimeout(unlockTimer);
			unlockTimer = setTimeout(() => (isManualScroll = false), SCROLL_LOCK_MS);
		};

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
			if (!settle || !viewport.external) return;
			const current = viewport;
			await nextTick();
			// 期间卸载、切回 fill 或重新绑定了滚动源，则放弃这次补算
			if (!isMounted.value || props.fill || current !== viewport) return;
			viewport.invalidate();
			setVisibleItemRange();
		};

		// 是否滚动到接近触发加载的边缘（inverted 为列表头部，否则为尾部）
		const isNearLoadEdge = () => {
			const state = viewport.state();
			if (!state) return false;
			const { threshold } = props;
			// 外部滚动源里列表只是页面的一段：视口尚未与列表相交时不加载
			if (viewport.external) {
				const intersects = state.viewportEnd >= state.listStart - threshold
					&& state.viewportStart <= state.listEnd + threshold;
				if (!intersects) return false;
			}
			if (store.props.inverted) {
				return state.viewportStart - threshold <= state.listStart;
			}
			// 距尾部阈值线的剩余距离；内部滚动源沿用严格判断，恰好停在阈值线上不触发
			const remain = state.listEnd - threshold - state.viewportEnd;
			return viewport.external ? remain <= 0 : remain < 0;
		};

		// 内容是否不足一屏：不足时无法通过滚动触发加载，需要主动继续
		const isContentUnderfilled = () => {
			const size = viewport.external
				? viewport.clientSize
				: (wrapper.value?.[K.offsetSize] || 0);
			return store.states.contentMaxSize > 0
				&& store.states.contentMaxSize <= size;
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
			const base = viewport.external ? state.contentStart : 0;
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
		// 测量与布局
		// ---------------------------------------------------------------------
		/**
		 * 读取节点 DOM 的实际尺寸写回 store
		 *
		 * 待测量节点都在隐藏池中渲染过，优先读池；已可见的节点兜底读列内元素；
		 * 都读不到（占位节点）则用骨架尺寸
		 * @param index 数据索引
		 * @returns 被测量的节点；节点已被回收时为 undefined
		 */
		const measureNode = (index: number) => {
			const node = store.nodes.get(index);
			// 受到 store.nodes.trimPlaceholders 影响，无效的会被回收
			if (!node) return;
			const dom = pooledEls[index] || visibleEls[index];
			store.nodes.setSize(node, (dom && dom[K.offsetSize]) || placeholderFallbackSize.value);
			return node;
		};

		let isLayoutRunning = false;
		const layoutInterrupter = Interrupter.of();
		const deferInterrupter = Interrupter.of();
		const handleDeferComplete = () => deferInterrupter.finish();

		/**
		 * 构建 [start, end) 区间的节点，测量后重排并刷新可见范围
		 * @param start 区间起点（含）
		 * @param end 区间终点（不含）
		 * @param reversed inverted 本地翻页时逆序补建更早的数据
		 */
		const refreshLayout = async (start: number, end: number, reversed = false) => {
			if (start === end) {
				syncVisibleRange();
				return;
			}
			isLayoutRunning = true;
			const indices = store.nodes.build(start, end, reversed);
			// 等隐藏池把待测量节点渲染出来
			if (store.states.preData.length > 0) {
				await deferInterrupter;
			}
			await nextTick();
			const measured = indices
				.map(measureNode)
				.filter(Boolean) as RecycleListItemNodeRaw[];
			store.layout.refresh();

			// 外部滚动源的边界依赖真实 DOM 尺寸，等 patch 完成后再量
			if (viewport.external) await nextTick();
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

			layoutInterrupter.next();
			isLayoutRunning = false;
		};

		// 标记全部节点待重新测量后整体重排
		const forceRefreshLayout = async () => {
			viewport.invalidate();
			store.nodes.invalidate();
			await refreshLayout(...store.local.builtRange);
		};

		// ---------------------------------------------------------------------
		// inverted 滚动补偿
		// ---------------------------------------------------------------------
		// 外部滚动源下是否已把初始内容贴到列表尾部
		let invertedAligned = false;
		// 重新绑定滚动源时递增，作废进行中的对齐
		let alignToken = 0;

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

			const current = viewport;
			const token = alignToken;
			invertedAligned = true;
			await nextTick();
			if (
				token !== alignToken
				|| current !== viewport
				|| props.fill
				|| !store.props.inverted
			) return;

			viewport.invalidate();
			lockScroll();
			alignToListEnd();
			setVisibleItemRange();
			unlockScroll();
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
		const refreshInvertedLayout = async (
			start: number,
			end: number,
			options: { reversed?: boolean; originalSize?: number; offset?: () => number } = {}
		) => {
			lockScroll();
			const originalSize = options.originalSize ?? store.states.contentMaxSize;
			const originalOffset = viewport.offset;
			const originalContentStart = viewport.state()?.contentStart || 0;
			await refreshLayout(start, end, options.reversed);
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
			unlockScroll();
		};

		/**
		 * 远程分页落地后的布局刷新
		 * @param current 第 N 次请求（从 1 开始）
		 * @param start 区间起点
		 * @param end 区间终点
		 */
		const refreshLayoutByPage = async (current: number, start: number, end: number) => {
			if (!store.props.inverted) {
				await refreshLayout(start, end);
				return;
			}

			await refreshInvertedLayout(start, end, {
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
				? await refreshInvertedLayout(start, end, {
						reversed,
						offset: () => viewport.offset
					})
				: await refreshLayout(start, end);
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
			await refreshLayout(start, end);
			if (!store.props.inverted) return;

			lockScroll();
			const position = store.states.contentMaxSize - originalSize + originalScrollPosition;
			if (viewport.external && originalSize === 0) {
				const current = viewport;
				await nextTick();
				if (!props.fill && current === viewport) {
					viewport.invalidate();
					alignToListEnd();
				}
			} else {
				viewport.scrollTo(position);
			}
			if (hasRealNodes()) {
				setVisibleItemRange();
			}
			unlockScroll();
		};

		const loadRemoteData = async (onBeforeCommit?: () => void) => {
			const { current, response, start, end } = await store.fetchPage(onBeforeCommit);
			if (!response || !response.data) {
				stopScroll();
				return;
			}
			await refreshLayoutByPage(current, start, end);

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

			// 本次构建/加载完成且内容不足一屏时，继续处理下一批
			if (canContinue && isContentUnderfilled()) {
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
			if (store.scroll.currentLeaf !== leaf || isManualScroll) return;

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

		// 图片撑开等导致布局变化，节流结束后整体重排并保持首个可见项不跳动
		const handleResize = throttle(async () => {
			if (!wrapper.value) return;
			const state = viewport.state();
			lastClientSize = state?.clientSize || wrapper.value[K.clientSize];
			viewport.invalidate();
			if (!hasRealNodes()) return;

			const anchorIndex = store.states.firstItemIndex;
			const oldPosition = store.states.rebuildData[anchorIndex]?.states.position;
			await forceRefreshLayout();
			const newPosition = store.states.rebuildData[anchorIndex]?.states.position;

			// item 尚未完成初始定位（position = -1000）时不补偿
			if (typeof oldPosition === 'number' && oldPosition >= 0 && typeof newPosition === 'number') {
				viewport.scrollTo(viewport.offset + (newPosition - oldPosition));
			}
		}, 50, {
			leading: false,
			trailing: true
		});

		// 外部承载者尺寸变化
		const handleViewportResize = () => {
			viewport.invalidate();
			lastClientSize = viewport.clientSize;
			setVisibleItemRange();
			isContentUnderfilled() && loadData();
			handleResize();
		};

		/**
		 * 按当前 fill 重建滚动源；挂载、fill / vertical 变化时调用
		 * 原 bindExternalViewport / unbindExternalViewport
		 */
		const rebindViewport = () => {
			viewport.unbind();
			alignToken++;
			invertedAligned = false;
			// 换轴/换承载者后旧的兜底尺寸不再可信
			lastClientSize = 0;
			viewport = createViewport({
				external: !props.fill,
				root: getRoot(),
				injected: injectedScroller,
				keys: K,
				anchors,
				handlers
			});
			viewport.bind();
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

			await refreshLayout(...store.local.builtRange);
			await alignInvertedOnce();

			// 追加数据时若已停在加载阈值内（如列表底部），无需再滚动即继续构建
			wrapper.value && store.local.hasMore && isNearLoadEdge() && loadData();
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
			Resize.on(wrapper.value, handleResize);
			rebindViewport();
			loadData();
			isMounted.value = true;
			wrapper.value.addEventListener(moveEventName, handleStoreLeafChange);
		});

		onBeforeUnmount(() => {
			isMounted.value = false;
			alignToken++;
			clearTimeout(unlockTimer);
			viewport.unbind();
			Resize.off(wrapper.value, handleResize);
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
				await forceRefreshLayout();
			},
			{ flush: 'post' }
		);

		// 从禁用切回启用时，只有内容为空或不足一屏才自动加载
		watch(
			() => props.disabled,
			async (v, oldV) => {
				if (!isMounted.value || oldV !== true || v !== false) return;
				if (isLayoutRunning) {
					await layoutInterrupter;
				}
				if (!isMounted.value) return;
				if (store.states.contentMaxSize === 0 || isContentUnderfilled()) {
					loadData();
				}
			}
		);

		expose({
			recycleListId: getUid('recycle-list'),
			scroller,
			store,
			hasPlaceholder,
			renderer,
			// methods
			reset,
			scrollTo,
			scrollToIndex,
			refreshLayout: forceRefreshLayout
		});

		// ---------------------------------------------------------------------
		// 渲染
		// ---------------------------------------------------------------------
		const renderPlaceholder = () => {
			return slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />));
		};

		const renderItem = (item: RecycleListItemNodeRaw) => (
			<Fragment key={item.id}>
				{
					item.states.isPlaceholder && hasPlaceholder.value && (
						<div
							class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
							style={{ opacity: +!item.states.loaded }}
						>
							{ renderPlaceholder() }
						</div>
					)
				}
				{
					!item.states.isPlaceholder && (
						<Resizer
							ref={v => trackEl(visibleEls, item.states.index, v)}
							class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
							style={{ opacity: +item.states.loaded }}
							fill={false}
							data-row={item.states.index}
							data-column={item.states.column}
							data-size={item.states.size}
							data-position={item.states.position}
							// @ts-ignore
							onResize={e => e?.inited === true && handleResize()}
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
				<Defer data={store.states.preData} onComplete={handleDeferComplete}>
					{{
						default: ({ row: item }) => (
							<div
								ref={v => trackEl(pooledEls, item.states.index, v)}
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
					{ store.props.inverted && (<ScrollState ref={scrollState} />) }
					{ slots.header?.() }
					<div
						ref={content}
						class="vc-recycle-list__content"
						style={{ [K.contentSize]: store.states.contentMaxSize + 'px' }}
					>
						{ store.states.columns.map(renderColumn) }
						{ renderPool() }
					</div>
					{ slots.footer?.() }
					{ !store.props.inverted && (<ScrollState ref={scrollState} />) }
				</ScrollerWheel>
			</Container>
		);
	}
});
