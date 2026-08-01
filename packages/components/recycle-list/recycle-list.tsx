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
import {
	ExternalViewport,
	invalidateViewport,
	registerViewport,
	resolveExternalViewport
} from './viewport';

const isTouch = typeof document !== 'undefined' && 'ontouchend' in document;
const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize'],
	setup(props, { slots, expose, emit }) {
		const instance = getCurrentInstance()!;
		const injectedScroller = inject<any>('vc-scroller', undefined);
		const store = props.store || new Store(props);
		const K = useDirectionKeys();
		const isMounted = ref(false);

		// el; 仅供测量读取，不参与渲染，因此不需要响应式，卸载时置空避免无限堆积
		const curloads: Record<number, any> = {};
		const preloads: Record<number, any> = {};
		const setLoad = (target: Record<number, any>, key: number, el: any) => {
			if (el) {
				target[key] = el;
			} else {
				delete target[key];
			}
		};
		const placeholder = shallowRef();
		const scroller = shallowRef();
		const content = shallowRef();
		const scrollState = shallowRef();
		const wrapperSize = {
			[K.clientSize]: 0
		};
		let externalViewport: ExternalViewport | undefined;
		let unregisterViewport: (() => void) | undefined;
		let boundsDirty = true;
		const bounds = {
			listStart: 0,
			listEnd: 0,
			contentStart: 0
		};

		let originalScrollPosition = 0; // 数据load前滚动条位置
		const layoutInterrupter = Interrupter.of();
		const deferInterrupter = Interrupter.of();

		const wrapper = computed(() => {
			return scroller.value?.wrapper;
		});
		const getRoot = () => instance.vnode.el as HTMLElement | undefined;
		const invalidateBounds = () => {
			boundsDirty = true;
		};
		const refreshBounds = () => {
			if (props.fill || !externalViewport || !boundsDirty) return;
			const root = getRoot();
			if (!root) return;
			bounds.listStart = externalViewport.getElementStart(root);
			bounds.contentStart = content.value
				? externalViewport.getElementStart(content.value)
				: bounds.listStart;
			bounds.listEnd = Math.max(
				externalViewport.getElementEnd(root),
				bounds.contentStart + store.states.contentMaxSize
			);
			boundsDirty = false;
		};
		const getViewportState = () => {
			const el = wrapper.value;
			if (props.fill || !externalViewport) {
				if (!el) return;
				const clientSize = el[K.clientSize] || wrapperSize[K.clientSize] || 0;
				return {
					viewportStart: el[K.scrollAxis] || 0,
					viewportEnd: (el[K.scrollAxis] || 0) + clientSize,
					clientSize,
					listStart: 0,
					listEnd: el[K.scrollSize] || 0,
					contentStart: content.value?.[K.offsetPosition] || 0
				};
			}
			refreshBounds();
			const viewportStart = externalViewport.mainOffset;
			const clientSize = externalViewport.clientSize;
			return {
				viewportStart,
				viewportEnd: viewportStart + clientSize,
				clientSize,
				...bounds
			};
		};
		const getMainScrollPosition = () => {
			return (!props.fill && externalViewport)
				? externalViewport.mainOffset
				: (wrapper.value?.[K.scrollAxis] || 0);
		};
		const setMainScrollPosition = (value: number, force?: boolean) => {
			if (!props.fill && externalViewport) {
				(force || externalViewport.mainOffset !== value) && externalViewport.setMainOffset(value);
				return;
			}
			const el = wrapper.value;
			if (!el) return;
			(force || el[K.scrollAxis] !== value) && (el[K.scrollAxis] = value);
			scroller.value?.scrollTo({ [K.axis]: value });
		};
		const createScrollEvent = () => {
			const el = wrapper.value;
			const state = getViewportState();
			if (!el || !state) return;
			const delegates = {
				scrollLeft: props.vertical ? el.scrollLeft : state.viewportStart,
				scrollTop: props.vertical ? state.viewportStart : el.scrollTop,
				clientWidth: props.vertical ? el.clientWidth : state.clientSize,
				clientHeight: props.vertical ? state.clientSize : el.clientHeight,
				scrollWidth: props.vertical
					? el.scrollWidth
					: (externalViewport?.scrollSize || el.scrollWidth),
				scrollHeight: props.vertical
					? (externalViewport?.scrollSize || el.scrollHeight)
					: el.scrollHeight,
				getBoundingClientRect: () => el.getBoundingClientRect()
			};
			return {
				target: delegates,
				currentTarget: delegates
			} as any;
		};

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

		const hasPlaceholder = computed(() => {
			return !!slots.placeholder || renderer.value.placeholder;
		});

		// 骨架DOM的实际尺寸，作为测量兜底
		const placeholderFallbackSize = computed(() => {
			if (!hasPlaceholder.value) return 0;
			return placeholder.value[K.offsetSize];
		});

		const handleDeferComplete = () => deferInterrupter.finish();

		const scrollTo = (options: any, force?: boolean) => {
			let options$ = { x: 0, y: 0 };
			if (typeof options === 'number') {
				options$[K.axis] = options;
			} else if (typeof options === 'object') {
				options$ = Object.assign(options$, options);
			}

			const el = wrapper.value;
			if (!el) return;

			if (props.fill || !externalViewport) {
				(force || el.scrollLeft !== options$.x) && (el.scrollLeft = options$.x);
				(force || el.scrollTop !== options$.y) && (el.scrollTop = options$.y);
				scroller.value.scrollTo(options);
				return;
			}

			const crossAxis = props.vertical ? 'x' : 'y';
			const crossScrollAxis = props.vertical ? 'scrollLeft' : 'scrollTop';
			const crossValue = options$[crossAxis];
			(force || el[crossScrollAxis] !== crossValue) && (el[crossScrollAxis] = crossValue);
			setMainScrollPosition(options$[K.axis], force);
			scroller.value.scrollTo({ [crossAxis]: crossValue });
		};

		const scrollToIndex = (index: number, offset = 0) => {
			const item = store.states.rebuildData[index];
			if (!(item?.states.position >= 0)) return;
			if (props.fill || !externalViewport) {
				scrollTo(item.states.position + offset);
			} else {
				refreshBounds();
				const crossAxis = props.vertical ? 'x' : 'y';
				const crossScrollAxis = props.vertical ? 'scrollLeft' : 'scrollTop';
				if (wrapper.value) wrapper.value[crossScrollAxis] = 0;
				setMainScrollPosition(bounds.contentStart + item.states.position + offset);
				scroller.value?.scrollTo({ [crossAxis]: 0 });
			}
		};

		const refreshItemSize = (index: number) => {
			const current = store.nodes.get(index);

			// 受到`store.nodes.trimPlaceholders`影响,无效的会被回收
			if (!current) return;

			const original = { ...current.states };
			const dom = preloads[index] || curloads[store.props.inverted ? index : index - store.states.firstItemIndex];
			store.nodes.setSize(current, (dom && dom[K.offsetSize]) || placeholderFallbackSize.value);

			return { original, changed: current };
		};

		const setVisibleItemRange = () => {
			const state = getViewportState();
			if (!state) return;
			const overscan = Math.max(0, props.overscan);
			const headPosition = state.viewportStart - state.contentStart - overscan;
			const tailPosition = state.viewportEnd - state.contentStart + overscan;

			store.position.updateVisibleRange(headPosition, tailPosition);
		};

		// 是否滚动到接近触发加载的边缘（inverted为头部，否则为尾部）
		const isNearLoadEdge = () => {
			const state = getViewportState();
			if (!state) return false;
			const intersects = props.fill || (
				state.viewportEnd >= state.listStart - props.threshold
				&& state.viewportStart <= state.listEnd + props.threshold
			);
			return store.props.inverted
				? intersects && state.viewportStart - props.threshold <= state.listStart
				: intersects && (
					props.fill
						? state.viewportEnd > state.listEnd - props.threshold
						: state.viewportEnd >= state.listEnd - props.threshold
				);
		};

		const stopScroll = () => {
			store.stop();
			invalidateBounds();
			invalidateViewport(externalViewport?.target as object | undefined);
			setVisibleItemRange();
			if (!props.fill && externalViewport) {
				const viewport = externalViewport;
				nextTick(() => {
					if (!isMounted.value || props.fill || viewport !== externalViewport) return;
					invalidateBounds();
					invalidateViewport(viewport.target as object);
					setVisibleItemRange();
				});
			}
		};
		let isRefreshLayout = 0;
		const refreshLayout = async (start: number, end: number, reversed = false) => {
			if (start === end) {
				if (!props.fill && externalViewport) {
					invalidateBounds();
					invalidateViewport(externalViewport.target as object);
					setVisibleItemRange();
				}
				return;
			}
			isRefreshLayout = 1;
			const resizeChanges = [] as any[];
			const indices = store.nodes.build(start, end, reversed);
			if (store.states.preData.length > 0) {
				await deferInterrupter;
			}
			await Promise.all(indices.map(i => nextTick(() => {
				const e = refreshItemSize(i);
				e && resizeChanges.push(e.changed);
			})));
			store.layout.refresh();
			if (!props.fill && externalViewport) await nextTick();
			invalidateBounds();
			invalidateViewport(externalViewport?.target as object | undefined);

			const isPlaceholderOnly = !store.nodes.real.size;
			if (isPlaceholderOnly) {
				store.states.firstItemIndex = 0;
				store.states.lastItemIndex = store.states.rebuildData.length - 1;
			} else {
				setVisibleItemRange();
			}
			resizeChanges.length > 0 && emit('row-resize', resizeChanges.map(i => ({ size: i.states.size, index: i.states.index })));

			layoutInterrupter.next();
			isRefreshLayout = 0;
		};

		let isManualScroll = 0;
		let externalInvertedAligned = false;
		let externalInvertedAlignToken = 0;
		const alignExternalInverted = async () => {
			if (
				props.fill
				|| !externalViewport
				|| !store.props.inverted
				|| externalInvertedAligned
				|| store.states.contentMaxSize <= 0
				|| store.nodes.real.size === 0
			) return;

			const viewport = externalViewport;
			const token = externalInvertedAlignToken;
			externalInvertedAligned = true;
			await nextTick();
			if (
				token !== externalInvertedAlignToken
				|| viewport !== externalViewport
				|| props.fill
				|| !store.props.inverted
			) return;

			invalidateBounds();
			refreshBounds();
			isManualScroll = 1;
			setMainScrollPosition(Math.max(0, bounds.listEnd - viewport.clientSize));
			setVisibleItemRange();
			setTimeout(() => (isManualScroll = 0), 16.7);
		};
		// inverted下补建的内容会向上撑开，构建期间锁定滚动，结束后补偿滚动距离保持视口不跳动
		const refreshInvertedLayout = async (
			start: number,
			end: number,
			options: { reversed?: boolean; originalSize?: number; offset?: () => number } = {}
		) => {
			isManualScroll = 1;
			const originalSize = options.originalSize ?? store.states.contentMaxSize;
			const originalMainPosition = getMainScrollPosition();
			refreshBounds();
			const originalContentStart = bounds.contentStart;
			await refreshLayout(start, end, options.reversed);
			const delta = store.states.contentMaxSize - originalSize;
			if (props.fill || !externalViewport) {
				scrollTo(delta + (options.offset?.() || 0));
			} else {
				refreshBounds();
				const state = getViewportState();
				const target = originalSize === 0
					? bounds.listEnd - (state?.clientSize || 0)
					: (options.offset?.() ?? originalMainPosition)
						+ delta
						+ bounds.contentStart
						- originalContentStart;
				setMainScrollPosition(Math.max(0, target));
				if (originalSize === 0 && store.nodes.real.size > 0) {
					externalInvertedAligned = true;
				}
			}
			setVisibleItemRange();
			setTimeout(() => (isManualScroll = 0), 16.7); // 避免主动滚动时，触发handleScroll的loadData事件
		};

		const refreshLayoutByPage = async (current: number, start: number, end: number) => {
			if (!store.props.inverted) return refreshLayout(start, end);

			await refreshInvertedLayout(start, end, {
				originalSize: current === 1 ? 0 : store.states.contentMaxSize,
				offset: () => {
					if (current === 1) return 0;
					const scrollPosition = getMainScrollPosition();
					if (!props.fill && externalViewport) return scrollPosition;
					// 当偏移值只是新增加的高度, 提前滚动了则要显示之前的位置
					return scrollPosition !== originalScrollPosition ? scrollPosition : 0;
				}
			});
		};

		// 本地数据(data)按 batchCount 懒构建下一批
		let isBuildingLocal = 0;
		const buildLocalPage = async () => {
			if (isBuildingLocal || !store.local.hasMore) return false;
			isBuildingLocal = 1;
			const { start, end, reversed } = store.local.consumePage()!;
			reversed
				? await refreshInvertedLayout(start, end, {
						reversed,
						offset: () => getMainScrollPosition()
					})
				: await refreshLayout(start, end);
			isBuildingLocal = 0;
			return true;
		};

		const loadRemoteData = async (onBeforeSetData?: any) => {
			const { current, response, start, end } = await store.fetchPage(onBeforeSetData);
			if (!response || !response.data) {
				stopScroll();
			} else {
				await refreshLayoutByPage(current, start, end);

				// 响应条数少于预分配的占位时，回收多余骨架，避免后续id漂移
				if (store.nodes.trimPlaceholders()) {
					store.layout.refresh();
					invalidateBounds();
					invalidateViewport(externalViewport?.target as object | undefined);
					setVisibleItemRange();
					if (!props.fill && externalViewport) {
						const viewport = externalViewport;
						await nextTick();
						if (!props.fill && viewport === externalViewport) {
							invalidateBounds();
							invalidateViewport(viewport.target as object);
							setVisibleItemRange();
						}
					}
				}

				if (response.finished) {
					stopScroll();
				}
			}
		};

		const isContentUnderfilled = () => {
			const state = getViewportState();
			const size = props.fill
				? (wrapper.value?.[K.offsetSize] || 0)
				: (state?.clientSize || 0);
			return store.states.contentMaxSize > 0
				&& store.states.contentMaxSize <= size;
		};

		const loadData = async (onBeforeSetData?: any) => {
			if (store.states.isSilentRefresh) return;
			let canContinue: boolean;

			// 本地数据未构建完时优先懒构建（数据已在本地，不受disabled/isEnd约束）；
			// onBeforeSetData存在说明是刷新流程（reset slient），直接走远程
			if (!onBeforeSetData && store.local.hasMore) {
				canContinue = await buildLocalPage();
			} else {
				if (props.disabled || store.states.isEnd || store.states.isLoading) return;
				originalScrollPosition = getMainScrollPosition();
				if (hasPlaceholder.value) {
					const { start, end } = store.nodes.allocatePlaceholders();
					const originalSize = store.states.contentMaxSize;
					await refreshLayout(start, end);
					if (store.props.inverted) {
						isManualScroll = 1;
						const position = store.states.contentMaxSize - originalSize + originalScrollPosition;
						if (props.fill || !externalViewport) {
							scrollTo(position);
						} else if (originalSize === 0) {
							const viewport = externalViewport;
							await nextTick();
							if (!props.fill && viewport === externalViewport) {
								invalidateBounds();
								refreshBounds();
								setMainScrollPosition(Math.max(0, bounds.listEnd - viewport.clientSize));
							}
						} else {
							setMainScrollPosition(position);
						}
						if (store.states.rebuildData.some(item => item && !item.states.isPlaceholder)) {
							setVisibleItemRange();
						}
						setTimeout(() => (isManualScroll = 0), 16.7);
					}
				}
				await loadRemoteData(onBeforeSetData);
				canContinue = !store.states.isEnd;
			}

			// 本次构建/加载完成且内容不足一屏时，继续处理下一批
			if (canContinue && isContentUnderfilled()) {
				loadData();
			}
		};

		const reset = async (slient = false) => {
			store.reset();
			if (props.fill || !externalViewport) {
				wrapper.value && (wrapper.value[K.scrollAxis] = 0);
			} else {
				setMainScrollPosition(0);
			}

			const done = () => store.clear();
			if (!slient) {
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

		/**
		 * 最大滚动距离：el.scrollHeight - el.clientHeight
		 * store.states.contentMaxSize不含loading，以及wrapper的border, padding
		 * @param e FakeUIEvent, 避免对dom的属性的获取，该值是提前计算出来的
		 * @return ~
		 */
		const handleScroll = (e: any) => {
			if (store.scroll.currentLeaf !== (instance as any) || isManualScroll) return;

			isNearLoadEdge() && loadData();
			setVisibleItemRange();
			store.scroll.broadcast(e);
			emit('scroll', e);
		};

		const forceRefreshLayout = async () => {
			invalidateBounds();
			store.nodes.invalidate();
			await refreshLayout(...store.local.builtRange);
		};

		// 图片撑开时，会影响布局, 节流结束后调用
		const handleResize = throttle(async () => {
			if (!wrapper.value) return;
			// 保持原来的位置
			const state = getViewportState();
			wrapperSize[K.clientSize] = state?.clientSize || wrapper.value[K.clientSize];
			invalidateBounds();
			invalidateViewport(externalViewport?.target as object | undefined);
			const isNeedRefreshLayout = store.states.rebuildData.some(i => i && !i.states.isPlaceholder);

			if (isNeedRefreshLayout) {
				const oldFirstItemIndex = store.states.firstItemIndex;
				const oldPosition = store.states.rebuildData[oldFirstItemIndex]?.states.position;
				await forceRefreshLayout();
				const newPosition = store.states.rebuildData[oldFirstItemIndex]?.states.position;

				// item 尚未完成初始定位（item.postion = -1000）, 不应执行 scrollTop 补偿
				if (typeof oldPosition === 'number' && oldPosition >= 0) {
					const delta = newPosition - oldPosition;
					if (props.fill || !externalViewport) {
						wrapper.value[K.scrollAxis] += delta;
					} else {
						setMainScrollPosition(getMainScrollPosition() + delta);
					}
				}
			}
		}, 50, {
			leading: false,
			trailing: true
		});

		const handleExternalScroll = () => {
			const e = createScrollEvent();
			e && handleScroll(e);
		};
		const handleInnerScroll = (e: any) => {
			handleScroll((!props.fill && externalViewport) ? createScrollEvent() : e);
		};
		const handleViewportResize = () => {
			invalidateBounds();
			wrapperSize[K.clientSize] = externalViewport?.clientSize || 0;
			setVisibleItemRange();
			isContentUnderfilled() && loadData();
			handleResize();
		};
		const unbindExternalViewport = () => {
			externalInvertedAlignToken++;
			externalInvertedAligned = false;
			if (!externalViewport) return;
			externalViewport.off(handleExternalScroll);
			if (externalViewport.isWindow) {
				(externalViewport.target as Window).removeEventListener('resize', handleViewportResize);
			} else {
				Resize.off(externalViewport.target as HTMLElement, handleViewportResize);
			}
			unregisterViewport?.();
			unregisterViewport = undefined;
			externalViewport = undefined;
			invalidateBounds();
		};
		const bindExternalViewport = () => {
			unbindExternalViewport();
			if (props.fill) return;
			const root = getRoot();
			if (!root) return;
			externalViewport = resolveExternalViewport(root, injectedScroller, K as any);
			externalViewport.on(handleExternalScroll);
			if (externalViewport.isWindow) {
				(externalViewport.target as Window).addEventListener('resize', handleViewportResize);
			} else {
				Resize.on(externalViewport.target as HTMLElement, handleViewportResize);
			}
			unregisterViewport = registerViewport(externalViewport.target as object, invalidateBounds);
			wrapper.value && (wrapper.value[K.scrollAxis] = 0);
			invalidateBounds();
			wrapperSize[K.clientSize] = externalViewport.clientSize;
			setVisibleItemRange();
			alignExternalInverted();
		};

		// 设置初始数据（模拟分页，只构建已构建区间，剩余部分随滚动构建）
		const setDataSource = async (v: any, oldV: any) => {
			if (!Array.isArray(v) || oldV === v) return;

			if (!store.setData(v)) return;

			await refreshLayout(...store.local.builtRange);
			await alignExternalInverted();

			// 追加数据时若已停在加载阈值内（如列表底部），无需再滚动即继续构建
			wrapper.value && store.local.hasMore && isNearLoadEdge() && loadData();
		};

		const handleStoreLeafChange = () => {
			store.scroll.currentLeaf = instance as any;
		};

		onBeforeMount(() => {
			store.scroll.add(instance as any);
		});

		const moveEventName = isTouch ? 'touchstart' : 'mouseenter';
		onMounted(() => {
			Resize.on(wrapper.value, handleResize);
			bindExternalViewport();
			loadData();
			isMounted.value = true;
			wrapper.value.addEventListener(moveEventName, handleStoreLeafChange);
		});

		onBeforeUnmount(() => {
			isMounted.value = false;
			unbindExternalViewport();
			Resize.off(wrapper.value, handleResize);
			store.scroll.remove(instance as any);
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
				bindExternalViewport();
				await forceRefreshLayout();
			},
			{ flush: 'post' }
		);

		// 切换值时，只有当内容高度为0时或高度不够会自动加载
		watch(
			() => props.disabled,
			async (v, oldV) => {
				if (
					isMounted.value
					&& oldV === true
					&& v === false
				) {
					if (isRefreshLayout) {
						await layoutInterrupter;
					}
					if (!isMounted.value) return;
					if (store.states.contentMaxSize === 0 || isContentUnderfilled()) {
						loadData();
					}
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
			refreshLayout: forceRefreshLayout,

		});
		return () => {
			return (
				<Container
					class={['vc-recycle-list', {
						'is-horizontal': !props.vertical,
						'is-external': !props.fill,
						'is-inverted': store.props.inverted
					}]}
					pullable={props.pullable}
					inverted={store.props.inverted}
					vertical={props.vertical}
					canPull={!props.fill ? () => getMainScrollPosition() === 0 : undefined}
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

							{
								store.states.columns.map((column, columnIndex) => (
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
											{
												store.states.data[columnIndex].map((item: any) => (
													<Fragment
														key={item.id}
													>
														{
															item.states.isPlaceholder && hasPlaceholder.value && (
																<div
																	class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
																	style={{ opacity: +!item.states.loaded }}
																>
																	{
																		// eslint-disable-next-line @stylistic/max-len
																		slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />))
																	}
																</div>
															)
														}
														{
															!item.states.isPlaceholder && (
																<Resizer
																	ref={v => setLoad(curloads, item.states.index, v)}
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
												))
											}
										</div>
										{ !props.vertical && columnIndex < store.props.cols - 1 && (<br />) }
									</Fragment>
								))
							}
							<div
								class="vc-recycle-list__pool"
								style={{ [K.columnSize]: store.states.columnSize, [K.paddingColumnHead]: `${store.states.columnOffsetGutter}px` }}
							>
								<Defer data={store.states.preData} onComplete={handleDeferComplete}>
									{{
										default: ({ row: item }) => (
											<div
												ref={v => setLoad(preloads, item.states.index, v)}
												class="vc-recycle-list__hidden"
											>
												{ slots.default?.({ row: item.states.data || {}, index: item.states.index }) }
											</div>
										)
									}}
								</Defer>
								<div ref={placeholder} class="vc-recycle-list__hidden">
									{
										slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />))
									}
								</div>
							</div>
						</div>
						{ slots.footer?.() }
						{ !store.props.inverted && (<ScrollState ref={scrollState} />) }
					</ScrollerWheel>
				</Container>
			);
		};
	}
});
