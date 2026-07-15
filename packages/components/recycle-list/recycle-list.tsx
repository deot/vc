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
	shallowRef
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

const isTouch = typeof document !== 'undefined' && 'ontouchend' in document;
const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll', 'row-resize'],
	setup(props, { slots, expose, emit }) {
		const instance = getCurrentInstance()!;
		const store = props.store || new Store(props);
		const K = useDirectionKeys();
		const isMounted = ref(false);

		// el
		const curloads = ref({});
		const preloads = ref({});
		const placeholder = shallowRef();
		const scroller = shallowRef();
		const content = shallowRef();
		const scrollState = shallowRef();
		const wrapperSize = {
			[K.clientSize]: 0
		};

		let originalScrollPosition = 0; // 数据load前滚动条位置
		const layoutInterrupter = Interrupter.of();
		const deferInterrupter = Interrupter.of();

		const wrapper = computed(() => {
			return scroller.value?.wrapper;
		});

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

			(force || el.scrollLeft !== options$.x) && (el.scrollLeft = options$.x);
			(force || el.scrollTop !== options$.y) && (el.scrollTop = options$.y);

			scroller.value.scrollTo(options);
		};

		const scrollToIndex = (index: number, offset = 0) => {
			const item = store.states.rebuildData[index];
			item?.states.position >= 0 && scrollTo(item.states.position + offset);
		};

		const refreshItemSize = (index: number) => {
			const current = store.props.inverted
				? store.states.rebuildData[store.states.rebuildDataIndexMap![index]]
				: store.states.rebuildData[index];

			// 受到`store.trimPlaceholders`影响,无效的会被回收
			if (!current) return;

			const original = { ...current.states };
			const dom = preloads.value[index] || curloads.value[store.props.inverted ? index : index - store.states.firstItemIndex];
			if (dom) {
				current.states.size = dom[K.offsetSize] || placeholderFallbackSize.value;
			} else {
				current.states.size = placeholderFallbackSize.value;
			}

			return { original, changed: current };
		};

		const setVisibleItemRange = () => {
			const el = wrapper.value;
			if (!el) return;
			const contentPosition = content.value?.[K.offsetPosition] || 0;
			const overscan = Math.max(0, props.overscan);
			const headPosition = el[K.scrollAxis] - contentPosition - overscan;
			const tailPosition = el[K.scrollAxis]
				- contentPosition
				+ (el[K.clientSize] || wrapperSize[K.clientSize] || 0)
				+ overscan;

			store.setRangeByPosition(headPosition, tailPosition);
		};

		// 是否滚动到接近触发加载的边缘（inverted为头部，否则为尾部）
		const isNearLoadEdge = (el: any) => {
			return store.props.inverted
				? el[K.scrollAxis] - props.threshold <= 0
				: el[K.scrollAxis] > el[K.scrollSize] - wrapperSize[K.clientSize] - props.threshold;
		};

		const stopScroll = () => {
			store.stop();
			setVisibleItemRange();
		};
		let isRefreshLayout = 0;
		const refreshLayout = async (start: number, end: number, reversed = false) => {
			if (start === end) return;
			isRefreshLayout = 1;
			const resizeChanges = [] as any[];
			const indices = store.buildItems(start, end, reversed);
			if (store.states.preData.length > 0) {
				await deferInterrupter;
			}
			await Promise.all(indices.map(i => nextTick(() => {
				const e = refreshItemSize(i);
				e && resizeChanges.push(e.changed);
			})));
			store.refreshItemPosition();

			const isPlaceholderOnly = store.states.rebuildData.every(item => item?.states.isPlaceholder);
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
		// inverted下补建的内容会向上撑开，构建期间锁定滚动，结束后补偿滚动距离保持视口不跳动
		const refreshInvertedLayout = async (
			start: number,
			end: number,
			options: { reversed?: boolean; originalSize?: number; offset?: () => number } = {}
		) => {
			isManualScroll = 1;
			const originalSize = options.originalSize ?? store.states.contentMaxSize;
			await refreshLayout(start, end, options.reversed);
			scrollTo(store.states.contentMaxSize - originalSize + (options.offset?.() || 0));
			setVisibleItemRange();
			setTimeout(() => (isManualScroll = 0), 16.7); // 避免主动滚动时，触发handleScroll的loadData事件
		};

		const refreshLayoutByPage = async (current: number, start: number, end: number) => {
			if (!store.props.inverted) return refreshLayout(start, end);

			await refreshInvertedLayout(start, end, {
				originalSize: current === 1 ? 0 : store.states.contentMaxSize,
				offset: () => {
					if (current === 1) return 0;
					const scrollPosition = wrapper.value[K.scrollAxis];
					// 当偏移值只是新增加的高度, 提前滚动了则要显示之前的位置
					return scrollPosition !== originalScrollPosition ? scrollPosition : 0;
				}
			});
		};

		// 本地数据(data)按 batchSize 懒构建下一批
		let isBuildingLocal = 0;
		const buildLocalPage = async () => {
			if (isBuildingLocal || !store.hasMoreLocalData) return false;
			isBuildingLocal = 1;
			const { start, end, reversed } = store.consumeLocalPage()!;
			reversed
				? await refreshInvertedLayout(start, end, {
						reversed,
						offset: () => wrapper.value[K.scrollAxis]
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
				if (store.trimPlaceholders()) {
					store.refreshItemPosition();
					setVisibleItemRange();
				}

				if (response.finished) {
					stopScroll();
				}
			}
		};

		const isContentUnderfilled = () => {
			return store.states.contentMaxSize > 0
				&& store.states.contentMaxSize <= wrapper.value?.[K.offsetSize];
		};

		const loadData = async (onBeforeSetData?: any) => {
			if (store.states.isSlientRefresh) return;
			let canContinue: boolean;

			// 本地数据未构建完时优先懒构建（数据已在本地，不受disabled/isEnd约束）；
			// onBeforeSetData存在说明是刷新流程（reset slient），直接走远程
			if (!onBeforeSetData && store.hasMoreLocalData) {
				canContinue = await buildLocalPage();
			} else {
				if (props.disabled || store.states.isEnd || store.states.isLoading) return;
				originalScrollPosition = wrapper.value[K.scrollAxis];
				if (hasPlaceholder.value) {
					const { start, end } = store.allocatePlaceholders();
					const originalSize = store.states.contentMaxSize;
					await refreshLayout(start, end);
					if (store.props.inverted) {
						isManualScroll = 1;
						scrollTo(store.states.contentMaxSize - originalSize + originalScrollPosition);
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
			wrapper.value[K.scrollAxis] = 0;

			const done = () => store.clear();
			if (!slient) {
				done();
				await loadData();
			} else {
				const next = loadData(done);
				store.states.isSlientRefresh = true;
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
		const handleScroll = (e: UIEvent) => {
			if (store.currentLeaf !== instance || isManualScroll) return;

			isNearLoadEdge(e.target!) && loadData();
			setVisibleItemRange();
			store.scrollTo(e);
			emit('scroll', e);
		};

		const forceRefreshLayout = async () => {
			store.invalidate();
			await refreshLayout(...store.builtRange);
		};

		// 图片撑开时，会影响布局, 节流结束后调用
		const handleResize = throttle(async () => {
			if (!wrapper.value) return;
			// 保持原来的位置
			const el = wrapper.value;
			wrapperSize[K.clientSize] = el[K.clientSize];
			const isNeedRefreshLayout = store.states.rebuildData.some(i => i && !i.states.isPlaceholder);

			if (isNeedRefreshLayout) {
				const oldFirstItemIndex = store.states.firstItemIndex;
				const oldPosition = store.states.rebuildData[oldFirstItemIndex]?.states.position;
				await forceRefreshLayout();
				const newPosition = store.states.rebuildData[oldFirstItemIndex]?.states.position;

				// item 尚未完成初始定位（item.postion = -1000）, 不应执行 scrollTop 补偿
				if (typeof oldPosition === 'number' && oldPosition >= 0) {
					el[K.scrollAxis] += newPosition - oldPosition;
				}
			}
		}, 50, {
			leading: false,
			trailing: true
		});

		// 设置初始数据（模拟分页，只构建已构建区间，剩余部分随滚动构建）
		const setDataSource = async (v: any, oldV: any) => {
			if (!Array.isArray(v) || oldV === v) return;

			if (!store.setData(v)) return;

			await refreshLayout(...store.builtRange);

			// 追加数据时若已停在加载阈值内（如列表底部），无需再滚动即继续构建
			const el = wrapper.value;
			el && store.hasMoreLocalData && isNearLoadEdge(el) && loadData();
		};

		const handleStoreLeafChange = () => {
			store.currentLeaf = instance;
		};

		onBeforeMount(() => {
			store.add(instance);
		});

		const moveEventName = isTouch ? 'touchstart' : 'mouseenter';
		onMounted(() => {
			Resize.on(wrapper.value, handleResize);
			loadData();
			isMounted.value = true;
			wrapper.value.addEventListener(moveEventName, handleStoreLeafChange);
		});

		onBeforeUnmount(() => {
			Resize.off(wrapper.value, handleResize);
			store.remove(instance);
			wrapper.value.removeEventListener(moveEventName, handleStoreLeafChange);
		});

		watch(
			() => props.data,
			setDataSource,
			{ immediate: true }
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
					if (store.states.contentMaxSize === 0 || store.states.contentMaxSize <= wrapper.value?.[K.offsetSize]) {
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
					class={['vc-recycle-list', { 'is-horizontal': !props.vertical }]}
					pullable={props.pullable}
					inverted={store.props.inverted}
					vertical={props.vertical}
					render={renderer.value.refresh}
					onRefresh={handleRefresh}
				>
					<ScrollerWheel
						ref={scroller}
						class="vc-recycle-list__wrapper"
						{
							...props.scrollerOptions
						}
						onScroll={handleScroll}
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
																	ref={v => curloads.value[item.states.index] = v}
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
												ref={v => preloads.value[item.states.index] = v}
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
