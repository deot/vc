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
	getCurrentInstance
} from 'vue';
import { throttle, getUid } from '@deot/helper-utils';
import { Resize } from '@deot/helper-resize';
import { Interrupter } from '@deot/helper-scheduler';
import { props as recycleListProps } from './recycle-list-props';
import { VcInstance } from '../vc';
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
		const placeholder = ref();
		const scroller = ref();
		const content = ref();
		const scrollState = ref();

		let originalScrollPosition = 0; // 数据load前滚动条位置
		const interrupter = Interrupter.of();

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

		const placeholderSize = computed(() => {
			if (!hasPlaceholder.value) return 0;
			return placeholder.value.offsetWidth;
		});

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
			item?.top && item.top >= 0 && scrollTo(item.top + offset);
		};

		const refreshItemSize = (index: number) => {
			const current = store.props.inverted
				? store.states.rebuildData[store.states.rebuildDataIndexMap[index]]
				: store.states.rebuildData[index];

			// 受到`store.removeUnusedPlaceholders`影响,无效的会被回收
			if (!current) return;

			const original = Object.assign({}, current);
			const dom = preloads.value[index] || curloads.value[store.props.inverted ? index : index - store.states.firstItemIndex];
			if (dom) {
				current.size = dom[K.offsetSize] || placeholderSize.value;
			} else if (current) {
				current.size = placeholderSize.value;
			}

			return { original, changed: current };
		};

		// 设置data首个元素的在originalData索引值
		const setFirstItemIndex = () => {
			if (!wrapper.value) return;
			const position = wrapper.value[K.scrollAxis];
			let item: any;
			for (let i = 0; i < store.states.rebuildData.length; i++) {
				item = store.states.rebuildData[i];
				if (!item || item.position > position) {
					store.states.firstItemIndex = Math.max(0, i - store.props.cols);
					break;
				}
			}
		};

		const stopScroll = (page: number) => {
			store.states.isEnd = true;
			store.removeUnusedPlaceholders(store.states.rebuildData.slice(0), page);
			store.refreshItemPosition();
			setFirstItemIndex();
		};
		let isRefreshLayout = 0;
		const refreshLayout = async (start: number, end: number) => {
			isRefreshLayout = 1;
			const promiseTasks = [] as Promise<any>[];
			const resizeChanges = [] as any[];
			let item: any;
			for (let i = start; i < end; i++) {
				item = store.props.inverted
					? store.states.rebuildData[store.states.rebuildDataIndexMap[i]]
					: store.states.rebuildData[i];

				if (item && item.loaded) continue;
				store.setItemData(i, store.originalData[i]);
				promiseTasks.push(nextTick(() => { const e = refreshItemSize(i); e && resizeChanges.push(e.changed); }));
			}
			await Promise.all(promiseTasks);
			store.refreshItemPosition();
			setFirstItemIndex();

			resizeChanges.length > 0 && emit('row-resize', resizeChanges.map(i => ({ size: i.size, index: i.id })));

			interrupter.next();
			isRefreshLayout = 0;
		};

		const refreshLayoutByPage = async (page: number) => {
			const el = wrapper.value;
			const start = (page - 1) * store.props.pageSize;
			const end = page * store.props.pageSize;
			const originalSize = page === 1 ? 0 : store.states.contentMaxSize;
			await refreshLayout(start, end);

			if (!store.props.inverted) return;

			const scrollPosition = el[K.scrollAxis];
			// 当偏移值只是新增加的高度, 提前滚动了则要显示之前的位置
			const changed = scrollPosition !== originalScrollPosition;
			const offset = page === 1 ? 0 : changed ? scrollPosition : 0;
			scrollTo(store.states.contentMaxSize - originalSize + offset);
		};

		// 用于为加载一屏幕时，自动扩容pageSize
		const setOffsetPageSize = () => {
			if (
				!store.states.isEnd
				&& store.states.contentMaxSize > 0
				&& store.states.contentMaxSize <= wrapper.value?.[K.offsetSize]
			) {
				store.states.offsetPageSize += store.props.pageSize;
				return true;
			}

			return false;
		};

		const loadRemoteData = async (onBeforeSetData?: any) => {
			const currentPage = store.promiseStack.length + 1;
			const promiseFetch = store.props.loadData(currentPage, store.props.pageSize);
			store.states.loadings.push('pending');
			store.promiseStack.push(promiseFetch);
			let response = await promiseFetch;
			if (Array.isArray(response)) {
				response = { data: response, finished: response.length < store.props.pageSize };
			}
			onBeforeSetData && onBeforeSetData();
			store.states.loadings.pop();
			if (!response || !response.data) {
				stopScroll(currentPage);
			} else {
				store.setOriginData(currentPage, response.data);
				await refreshLayoutByPage(currentPage);

				if (response.finished) {
					stopScroll(currentPage);
				}
			}
		};

		const loadData = async (onBeforeSetData?: any) => {
			if (props.disabled || store.states.isEnd || store.states.isSlientRefresh) return;
			originalScrollPosition = wrapper.value[K.scrollAxis];
			if (hasPlaceholder.value) {
				let start: number;
				let end: number;
				if (store.props.inverted) {
					start = store.states.rebuildData.length;
					end = start + store.props.pageSize;

					Array
						.from({ length: store.props.pageSize })
						.forEach((_, index) => {
							store.setItemData(index + start);
						});
				} else {
					start = store.states.rebuildData.length;
					store.states.rebuildData.length += store.props.pageSize;
					end = store.states.rebuildData.length;
				}

				const originalSize = store.states.contentMaxSize;
				await refreshLayout(start, end);
				store.props.inverted && scrollTo(store.states.contentMaxSize - originalSize);
				await loadRemoteData(onBeforeSetData);
			} else if (!store.states.isLoading) {
				await loadRemoteData(onBeforeSetData);
			}

			// 未加载且小于一屏时，自动加载下一页
			setOffsetPageSize() && loadData();
		};

		const reset = async (slient = false) => {
			store.states.isEnd = false;
			store.states.loadings = [];
			wrapper.value[K.scrollAxis] = 0;

			store.originalData = [];
			store.promiseStack = [];

			const done = () => {
				store.setData([]);
				store.states.contentMaxSize = 0;
				store.states.columnFillSize = [];
				store.states.firstItemIndex = 0;
				store.states.isSlientRefresh = false;
			};
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
			if (store.currentLeaf !== instance) return;
			const el = e.target!;
			if (
				(!store.props.inverted && el[K.scrollAxis] > el[K.scrollSize] - el[K.clientSize] - props.offset)
				|| (store.props.inverted && el[K.scrollAxis] - props.offset <= 0)
			) {
				loadData();
			}
			setFirstItemIndex();
			store.scrollTo(e);
			emit('scroll', e);
		};

		const forceRefreshLayout = async () => {
			store.states.rebuildData.forEach((item) => {
				item.loaded = 0;
			});
			await refreshLayout(0, store.states.rebuildData.length);
		};

		// 图片撑开时，会影响布局, 节流结束后调用
		const handleResize = throttle(async () => {
			if (!wrapper.value) return;
			const isNeedRefreshLayout = store.states.rebuildData.some(i => !i.isPlaceholder);

			if (isNeedRefreshLayout) {
				const oldFirstItemIndex = store.states.firstItemIndex;
				const oldPosition = store.states.rebuildData[oldFirstItemIndex]?.position;

				await forceRefreshLayout();
				const newPosition = store.states.rebuildData[oldFirstItemIndex]?.position;

				// 保持原来的位置
				const el = wrapper.value;
				el[K.scrollAxis] += newPosition - oldPosition;
			}
		}, 50, {
			leading: false,
			trailing: true
		});

		// 设置初始数据
		const setDataSource = async (v: any, oldV: any) => {
			if (!Array.isArray(v) || oldV === v) return;

			store.setData(v);

			store.states.offsetPageSize = 0;
			await refreshLayout(0, store.originalData.length);
			setOffsetPageSize();
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
						await interrupter;
					}
					if (store.states.contentMaxSize === 0 || store.states.contentMaxSize <= wrapper.value?.[K.offsetSize]) {
						loadData();
					}
				}
			}
		);

		expose({
			recycleListId: getUid('recycle-list'),
			store,
			hasPlaceholder,
			renderer,
			// methods
			reset,
			scrollTo,
			scrollToIndex,
			refreshLayout: forceRefreshLayout
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
												transform: `${K.translateAxis}(${store.states.data[columnIndex][0]?.position || 0}px)`
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
															item.isPlaceholder && hasPlaceholder.value && (
																<div
																	class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
																	style={{ opacity: +!item.loaded }}
																>
																	{
																		// eslint-disable-next-line @stylistic/max-len
																		slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />))
																	}
																</div>
															)
														}
														{
															!item.isPlaceholder && (
																<Resizer
																	ref={v => curloads.value[item.id] = v}
																	class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
																	style={{ opacity: item.loaded }}
																	fill={false}
																	data-row={item.id}
																	data-column={item.column}
																	data-size={item.size}
																	data-position={item.position}
																	// @ts-ignore
																	onResize={e => e?.inited === true && handleResize()}
																>
																	{ slots.default?.({ row: item.data || {}, index: item.id }) }
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
								{
									store.states.preData.map(item => (
										<Fragment
											key={item.id}
										>
											<div
												ref={v => preloads.value[item.id] = v}
												class="vc-recycle-list__hidden"
											>
												{ slots.default?.({ row: item.data || {}, index: item.id }) }
											</div>
										</Fragment>
									))
								}
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
