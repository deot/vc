/** @jsxImportSource vue */

import {
	defineComponent,
	ref,
	computed,
	onMounted,
	onBeforeUnmount,
	nextTick,
	watch,
	Fragment
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
import { Item } from './item';
import { useDirectionKeys } from './use-direction-keys';

const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	emits: ['scroll'],
	setup(props, { slots, expose, emit }) {
		const K = useDirectionKeys();
		const offsetPageSize = ref(0);
		const contentMaxSize = ref(0);
		const columnFillSize = ref<number[]>([]); // 优化inverted多列时用于补齐高度
		const firstItemIndex = ref(0);
		const loadings = ref<string[]>([]);
		const isEnd = ref(false);
		const isSlientRefresh = ref(false);
		const isMounted = ref(false);

		// el
		const curloads = ref({});
		const preloads = ref({});
		const placeholder = ref();
		const scroller = ref();
		const content = ref();
		const scrollState = ref();

		// data
		const rebuildData = ref<any[]>([]); // 封装后的数据，包含位置信息
		const rebuildDataIndexMap = ref({}); // 优化inverted下的find逻辑

		let originalData: any[] = []; // 原始数据
		let promiseStack: Promise<any>[] = []; // 每页数据栈信息

		let originalScrollPosition = 0; // 数据load前滚动条位置
		const interrupter = Interrupter.of();

		const wrapper = computed(() => {
			return scroller.value?.wrapper;
		});
		const columnSize = computed(() => {
			if (props.cols === 1) return;
			return `${100 / props.cols}%`;
		});

		const columnOffsetGutter = computed(() => {
			return props.gutter * (props.cols - 1) / props.cols;
		});
		const columns = computed(() => {
			const v = Array.from({ length: props.cols }).map((_, index) => ({ index, offset: [0, 0] }));
			v[0].offset = [0, columnOffsetGutter.value];
			for (let i = 1; i < v.length; i++) {
				const pre = v[i - 1].offset;

				v[i].offset = [props.gutter - pre[1], columnOffsetGutter.value - props.gutter + pre[1]];
			}

			return v;
		});

		// 用于展示的信息
		const data = computed(() => {
			const base = Array.from({ length: props.cols }).map(() => []);
			return rebuildData.value
				.slice(
					Math.max(0, firstItemIndex.value - props.pageSize),
					Math.min(rebuildData.value.length, firstItemIndex.value + props.pageSize + offsetPageSize.value)
				).reduce((pre, cur) => {
					cur.column >= 0 && pre[cur.column].push(cur);
					return pre;
				}, base);
		});

		const preData = computed(() => {
			return rebuildData.value.filter((i) => {
				return i && !i.isPlaceholder && !i.size;
			});
		});

		const renderer = computed(() => {
			const globalProps = VcInstance.options?.RecycleList || {};
			return {
				refresh: props.renderRefresh || globalProps.renderRefresh,
				placeholder: props.renderPlaceholder || globalProps.renderPlaceholder,
				loading: props.renderLoading || globalProps.renderLoading,
				finish: props.renderFinish || globalProps.renderFinish,
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

		const isLoading = computed(() => {
			return loadings.value.length;
		});

		const scrollTo = (options: any) => {
			let options$ = { x: 0, y: 0 };
			if (typeof options === 'number') {
				options$[K.axis] = options;
			} else if (typeof options === 'object') {
				options$ = Object.assign(options$, options);
			}

			const el = wrapper.value;
			const x = el.scrollLeft;
			const y = el.scrollTop;

			x !== options$.x && (el.scrollLeft = options$.x);
			y !== options$.y && (el.scrollTop = options$.y);
		};

		const scrollToIndex = (index: number, offset = 0) => {
			const item = rebuildData.value[index];
			item?.top && item.top >= 0 && scrollTo(item.top + offset);
		};

		const setRebuildDataMap = () => {
			if (!props.inverted) return;
			rebuildDataIndexMap.value = rebuildData.value.reduce((pre, cur, index) => {
				pre[cur.id] = index;
				return pre;
			}, {});
		};

		const setItemData = (index: number, $data?: any) => {
			const node = {
				id: index,
				data: $data || {},
				size: 0,
				position: -1000,
				isPlaceholder: !$data,
				loaded: $data ? 1 : 0,

				// 在第几列渲染
				column: -1
			};
			if (!props.inverted) return (rebuildData.value[index] = node);

			const index$ = rebuildDataIndexMap.value[index];
			typeof index$ === 'undefined'
				? rebuildData.value.unshift(node)
				: (rebuildData.value[index$] = node);
		};
		// 更新item.size
		const refreshItemSize = (index: number) => {
			const current = props.inverted
				? rebuildData.value[rebuildDataIndexMap.value[index]]
				: rebuildData.value[index];

			if (!current) return; // 受到`removeUnusedPlaceholders`影响，无效的会被回收

			const dom = preloads.value[index] || curloads.value[props.inverted ? index : index - firstItemIndex.value];
			if (dom) {
				current.size = dom[K.offsetSize] || placeholderSize.value;
			} else if (current) {
				current.size = placeholderSize.value;
			}
		};

		const refreshItemPosition = () => {
			const sizes = Array.from({ length: props.cols }).map(() => 0);
			const lastIndex = rebuildData.value.length - 1;

			let current: any;
			// 循环所有数据以更新item.top和总高度
			for (let i = 0; i <= lastIndex; i++) {
				current = rebuildData.value[props.inverted ? lastIndex - i : i];

				if (current) {
					const minSize = Math.min(...sizes);
					const minIndex = sizes[props.inverted ? 'findLastIndex' : 'findIndex'](v => v === minSize);

					current.position = sizes[minIndex] || 0;
					current.column = minIndex;

					sizes[minIndex] += current.size;
				}
			}

			if (props.inverted) {
				for (let i = 0; i <= lastIndex; i++) {
					current = rebuildData.value[i];

					if (current) {
						current.position = sizes[current.column] - current.position - current.size;
					}
				}
			}

			contentMaxSize.value = Math.max(...sizes);
			columnFillSize.value = sizes.map(i => contentMaxSize.value - i);
		};

		// 设置data首个元素的在originalData索引值
		const setFirstItemIndex = () => {
			const position = wrapper.value[K.scrollAxis];
			let item: any;
			for (let i = 0; i < rebuildData.value.length; i++) {
				item = rebuildData.value[i];
				if (!item || item.position > position) {
					firstItemIndex.value = Math.max(0, i - props.cols);
					break;
				}
			}
		};

		const removeUnusedPlaceholders = (copy: any[], page: number) => {
			const start = (page - 1) * props.pageSize;
			const end = page * props.pageSize;
			let cursor: number;
			if (!props.inverted) {
				for (cursor = start; cursor < end; cursor++) {
					if (copy[cursor]?.isPlaceholder) break;
				}
				rebuildData.value = copy.slice(0, cursor);
			} else {
				for (cursor = 0; cursor < end - start; cursor++) {
					if (!copy[cursor]?.isPlaceholder) break;
				}
				rebuildData.value = copy.slice(cursor);
			}
		};

		const stopScroll = (page: number) => {
			isEnd.value = true;
			removeUnusedPlaceholders(rebuildData.value.slice(0), page);
			refreshItemPosition();
			setFirstItemIndex();
		};
		let isRefreshLayout = 0;
		const refreshLayout = async (start: number, end: number) => {
			isRefreshLayout = 1;
			const promiseTasks = [] as Promise<any>[];
			let item: any;
			for (let i = start; i < end; i++) {
				item = props.inverted
					? rebuildData.value[rebuildDataIndexMap.value[i]]
					: rebuildData.value[i];

				if (item && item.loaded) {
					continue; // eslint-disable-line
				}
				setItemData(i, originalData[i]);
				promiseTasks.push(nextTick(() => refreshItemSize(i)));
			}
			await Promise.all(promiseTasks);
			refreshItemPosition();
			setFirstItemIndex();

			interrupter.next();
			isRefreshLayout = 0;
		};

		const refreshLayoutByPage = async (page: number) => {
			const el = wrapper.value;
			const start = (page - 1) * props.pageSize;
			const end = page * props.pageSize;
			const originalSize = page === 1 ? 0 : contentMaxSize.value;
			await refreshLayout(start, end);

			if (!props.inverted) return;

			const scrollPosition = el[K.scrollAxis];
			// 当偏移值只是新增加的高度, 提前滚动了则要显示之前的位置
			const changed = scrollPosition !== originalScrollPosition;
			const offset = page === 1 ? 0 : changed ? scrollPosition : 0;
			scrollTo(contentMaxSize.value - originalSize + offset);
		};

		const setOriginData = (page: number, res: any) => {
			const baseIndex = (page - 1) * props.pageSize;
			for (let i = 0; i < res.length; i++) {
				originalData[baseIndex + i] = res[i];
			}
		};

		// 用于为加载一屏幕时，自动扩容pageSize
		const setOffsetPageSize = () => {
			if (
				!isEnd.value
				&& contentMaxSize.value > 0
				&& contentMaxSize.value <= wrapper.value?.[K.offsetSize]
			) {
				offsetPageSize.value += props.pageSize;
				return true;
			}

			return false;
		};

		const loadRemoteData = async (onBeforeSetData?: any) => {
			const currentPage = promiseStack.length + 1;
			const promiseFetch = props.loadData(currentPage, props.pageSize);
			loadings.value.push('pending');
			promiseStack.push(promiseFetch);
			const res = await promiseFetch;
			onBeforeSetData && onBeforeSetData();
			loadings.value.pop();
			if (!res) {
				stopScroll(currentPage);
			} else {
				setOriginData(currentPage, res);
				await refreshLayoutByPage(currentPage);

				if (res.length < props.pageSize) {
					stopScroll(currentPage);
				}
			}
		};

		const loadData = async (onBeforeSetData?: any) => {
			if (props.disabled || isEnd.value || isSlientRefresh.value) return;
			originalScrollPosition = wrapper.value.scrollLeft;
			if (hasPlaceholder.value) {
				let start: number;
				let end: number;
				if (props.inverted) {
					start = rebuildData.value.length;
					end = start + props.pageSize;

					Array
						.from({ length: props.pageSize })
						.forEach((_, index) => {
							setItemData(index + start);
						});
					setRebuildDataMap();
				} else {
					start = rebuildData.value.length;
					rebuildData.value.length += props.pageSize;
					end = rebuildData.value.length;
				}

				const originalSize = contentMaxSize.value;
				await refreshLayout(start, end);
				props.inverted && scrollTo(contentMaxSize.value - originalSize);
				await loadRemoteData(onBeforeSetData);
			} else if (!isLoading.value) {
				await loadRemoteData(onBeforeSetData);
			}

			// 未加载且小于一屏时，自动加载下一页
			setOffsetPageSize() && loadData();
		};

		const reset = async (slient = false) => {
			isEnd.value = false;
			loadings.value = [];
			wrapper.value.scrollLeft = 0;

			originalData = [];
			promiseStack = [];

			const done = () => {
				rebuildData.value = [];
				rebuildDataIndexMap.value = {};
				contentMaxSize.value = 0;
				columnFillSize.value = [];
				firstItemIndex.value = 0;
				isSlientRefresh.value = false;
			};
			if (!slient) {
				done();
				await loadData();
			} else {
				const next = loadData(done);
				isSlientRefresh.value = true;
				await next;
			}
		};

		// 触发下拉刷新
		const handleRefresh = async () => {
			await reset(true);
		};

		/**
		 * 最大滚动距离：el.scrollHeight - el.clientHeight
		 * contentMaxSize.value不含loading，以及wrapper的border, padding
		 * @param e ~
		 * @return ~
		 */
		const handleScroll = (e: UIEvent) => {
			const el = wrapper.value;
			if (
				(!props.inverted && el[K.scrollAxis] > el[K.scrollSize] - el[K.clientSize] - props.offset)
				|| (props.inverted && el[K.scrollAxis] - props.offset <= 0)
			) {
				loadData();
			}
			setFirstItemIndex();
			emit('scroll', e);
		};

		const forceRefreshLayout = async () => {
			rebuildData.value.forEach((item) => {
				item.loaded = 0;
			});
			await refreshLayout(0, rebuildData.value.length);
		};

		// 图片撑开时，会影响布局, 节流结束后调用
		const handleResize = throttle(async () => {
			const isNeedRefreshLayout = rebuildData.value.some(i => !i.isPlaceholder);

			if (isNeedRefreshLayout) {
				const oldFirstItemIndex = firstItemIndex.value;
				const oldPosition = rebuildData.value[oldFirstItemIndex]?.position;

				await forceRefreshLayout();
				const newPosition = rebuildData.value[oldFirstItemIndex]?.position;

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

			if (props.dataSource.length % props.pageSize > 0) {
				isEnd.value = true;
			} else {
				promiseStack = Array
					.from({ length: Math.ceil(props.dataSource.length / props.pageSize) })
					.map(() => Promise.resolve());
			}

			originalData = [];
			// 这里不要originalData = toRaw(props.dataSource);
			props.dataSource.forEach((i, index) => {
				originalData[index] = i;
			});

			if (!originalData.length) {
				rebuildData.value = [];
			}

			offsetPageSize.value = 0;
			await refreshLayout(0, originalData.length);
			setOffsetPageSize();
		};

		onMounted(() => {
			Resize.on(wrapper.value, handleResize);
			loadData();
			isMounted.value = true;
		});

		onBeforeUnmount(() => {
			Resize.off(wrapper.value, handleResize);
		});

		watch(
			() => rebuildData.value.length,
			setRebuildDataMap
		);

		watch(
			() => props.dataSource,
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
					if (contentMaxSize.value === 0 || contentMaxSize.value <= wrapper.value?.[K.offsetSize]) {
						loadData();
					}
				}
			}
		);

		expose({
			recycleListId: getUid('recycle-list'),
			hasPlaceholder,
			isEnd,
			isSlientRefresh,
			isLoading,
			renderer,
			data,
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
					inverted={props.inverted}
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
						{ props.inverted && (<ScrollState ref={scrollState} />) }
						{ slots.header?.() }
						<div
							ref={content}
							class="vc-recycle-list__content"
							style={{ [K.contentSize]: contentMaxSize.value + 'px' }}
						>

							{
								columns.value.map((column, columnIndex) => (
									<Fragment key={columnIndex}>
										<div
											style={{
												[K.columnSize]: columnSize.value,
												[K.paddingColumnHead]: `${column.offset[0]}px`,
												[K.paddingColumnTail]: `${column.offset[1]}px`,
												transform: `${K.translateAxis}(${data.value[columnIndex][0]?.position || 0}px)`
											}}
											class={[{ 'is-inverted': props.inverted }, 'vc-recycle-list__column']}
										>
											{ props.inverted && (<div style={{ height: `${columnFillSize.value[columnIndex]}px` }} />) }
											{
												data.value[columnIndex].map((item: any) => (
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
																		slots.placeholder?.() || (renderer.value.placeholder && (<Customer render={renderer.value.placeholder} />))
																	}
																</div>
															)
														}
														{
															!item.isPlaceholder && (
																<Item
																	ref={v => curloads.value[item.id] = v}
																	class={{ 'vc-recycle-list__transition': hasPlaceholder.value }}
																	style={{ opacity: item.loaded }}
																	data-row={item.id}
																	data-column={item.column}
																	data-size={item.size}
																	data-position={item.position}
																	vertical={props.vertical}
																	onResize={handleResize}
																>
																	{ slots.default?.({ row: item.data || {}, index: item.id }) }
																</Item>
															)
														}
													</Fragment>
												))
											}
										</div>
										{ !props.vertical && columnIndex < props.cols - 1 && (<br />) }
									</Fragment>
								))
							}
							<div
								class="vc-recycle-list__pool"
								style={{ [K.columnSize]: columnSize.value, [K.paddingColumnHead]: `${columnOffsetGutter.value}px` }}
							>
								{
									preData.value.map(item => (
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
						{ !props.inverted && (<ScrollState ref={scrollState} />) }
					</ScrollerWheel>
				</Container>
			);
		};
	}
});
