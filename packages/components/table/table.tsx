/** @jsxImportSource vue */

import { defineComponent, provide, computed, ref, watch, getCurrentInstance, nextTick, onMounted, onUpdated, onUnmounted } from 'vue';
import { debounce } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
import { getUid } from '@deot/helper-utils';
import { parseHeight } from './utils';

import { Store, useStates } from './store';

// Table
import { TableBody } from './table-body';
import { TableHeader } from './table-header';
import { TableFooter } from './table-footer';
import { Affix } from '../affix';

import { props as tableProps } from './table-props';
import { useLazyTail } from './hooks/use-lazy-tail';
import { usePropsSync } from './hooks/use-props-sync';
import { useScrollSync } from './hooks/use-scroll-sync';
import { useWheelForward } from './hooks/use-wheel-forward';
import type { Nullable } from '@deot/helper-shared';

const COMPONENT_NAME = 'vc-table';

export const Table = defineComponent({
	name: COMPONENT_NAME,
	props: tableProps,
	emits: [
		'select',
		'select-all',
		'selection-change',
		'cell-mouse-enter',
		'cell-mouse-leave',
		'cell-click',
		'cell-dblclick',
		'cell-contextmenu',
		'row-click',
		'row-contextmenu',
		'row-dblclick',
		'header-click',
		'header-contextmenu',
		'current-change',
		'header-dragend',
		'expand-change',
		'sort-change',
		'update:sort',
		'update:columns',
		'load-change'
	],
	setup(props, { slots, expose, emit }) {
		const instance = getCurrentInstance()!;

		const store = new Store({ table: instance });
		const { layout } = store;

		const resizeProxyVisible = ref(false);
		const resizeState = ref({
			width: null,
			height: null
		});

		const tableWrapper = ref<Nullable<HTMLElement>>(null);
		// refs
		const hiddenColumns = ref<Nullable<HTMLElement>>(null);
		const headerWrapper = ref<any>(null);

		const body = ref<any>();
		const appendWrapper = ref<any>(null);
		const footerWrapper = ref<any>(null);
		// 底部 dock：横向滚动条锚点 + 合计行，由 affix 的 bottom 项整体吸底
		const bottomWrapper = ref<any>(null);
		const barAnchor = ref<Nullable<HTMLElement>>(null);
		const affixHeader = ref<any>(null);
		const affixFooter = ref<any>(null);

		const resizeProxy = ref<Nullable<HTMLElement>>(null);

		const isReady = ref(false);

		const states = useStates({
			columns: 'columns',
			isGroup: 'isGroup'
		}, store);

		const classes = computed(() => {
			return {
				'vc-table--fit': props.fit,
				'vc-table--striped': props.stripe,
				'vc-table--border': props.border || states.isGroup,
				'vc-table--divider': props.border || props.divider,
				'vc-table--scrollable-x': layout.states.scrollX,
				'vc-table--scrollable-y': layout.states.scrollY,
				'vc-table--enable-row-transition': (store.states.data || []).length !== 0 && (store.states.data || []).length < 100,
				[`vc-table--${props.size}`]: true
			};
		});

		const scroller = computed(() => {
			return body.value?.target;
		});
		const externalVirtualized = computed(() => {
			return !props.height && !props.maxHeight && props.virtualized;
		});
		const usesRecycleList = computed(() => {
			return !!props.height || externalVirtualized.value;
		});

		const bodyScroller = computed(() => {
			return usesRecycleList.value
				? scroller.value?.scroller
				: scroller.value;
		});

		const bodyXWrapper = computed(() => {
			return bodyScroller.value?.wrapper;
		});

		// 兼容保留：纵向与横向为同一个滚动容器
		const bodyYWrapper = computed(() => bodyXWrapper.value);

		// 表体是否出现纵向滚动：取 Scroller 实测的内容高度 / 视口高度（响应式，内容或尺寸变化时随之更新）
		watch(
			() => {
				const target = bodyScroller.value;
				return !!target && target.scrollHeight > target.clientHeight;
			},
			(v) => {
				layout.states.scrollY = v;
			},
			{ immediate: true }
		);

		const shouldUpdateHeight = computed(() => {
			return !!props.height || !!props.maxHeight;
		});

		const bodyWidthStyle = computed(() => {
			const { bodyWidth: $bodyWidth } = layout.states;
			return { width: $bodyWidth ? $bodyWidth + 'px' : '' };
		});

		const bodyHeightStyle = computed(() => {
			const { headerHeight, bodyHeight: $bodyHeight, footerHeight } = layout.states;
			if (props.height) {
				return {
					height: $bodyHeight ? $bodyHeight + 'px' : ''
				};
			} else if (props.maxHeight) {
				const maxHeight = parseHeight(props.maxHeight);
				if (maxHeight) {
					return {
						'max-height': (maxHeight - (footerHeight || 0) - (props.showHeader ? (headerHeight || 0) : 0)) + 'px'
					};
				}
			}
			return {};
		});

		const affixOptions = computed(() => {
			const fluidHeight = !props.height && !props.maxHeight;
			const source = Array.isArray(props.affix)
				? props.affix
				: [props.affix, props.affix];
			return (['top', 'bottom'] as const).map((placement, index) => {
				const item = source[index];
				const isObject = !!item && typeof item === 'object';
				return {
					placement,
					fixed: true,
					// 活动范围限定为表体：表头不越过表体底部、底部 dock（横向滚动条 + 合计行）不越过表体顶部，表格滚出后随之离开
					target: `.${tableId} .vc-table__body-wrapper`,
					...(isObject ? item : {}),
					disabled: !fluidHeight || !item || (isObject && (item as any).disabled)
				};
			});
		});

		let isUnMount = false;

		// 兼容保留：scrollY 已随 Scroller 实测自动更新，这里只重算列宽
		const updateScrollY = () => {
			if (isUnMount) return;
			layout.updateColumnsWidth();
		};

		// 吸顶表头、吸底 dock（横向滚动条 + 合计行）重算边界
		const refreshAffix = () => {
			nextTick(() => {
				affixHeader.value?.refresh?.();
				affixFooter.value?.refresh?.();
			});
		};

		/**
		 * 更新表格自身的布局：列宽、各区域高度、吸附边界
		 *
		 * 数据变化、列变化、尺寸变化等自动场景只走这里。虚拟行由内部 RecycleList 自行感知数据与尺寸变化，
		 * 不能在这里整体重测：那会让每次数据变化都把已构建的行重新渲染、测量一遍
		 */
		const updateLayout = () => {
			if (isUnMount) return;

			layout.updateColumnsWidth();
			if (shouldUpdateHeight.value) {
				layout.updateElsHeight();
			}

			// 虚拟行只需刷新视口几何与可见范围；非虚拟表格刷新 Scroller 的滚动条
			usesRecycleList.value
				? scroller.value?.refreshViewport?.()
				: scroller.value?.refresh?.();
			refreshAffix();
		};

		/**
		 * 对 Table 进行重新布局，并强制重新测量虚拟行。
		 * 当 Table 或其祖先元素由隐藏切换为显示时，可能需要调用此方法
		 */
		const refreshLayout = () => {
			if (isUnMount) return;
			updateLayout();
			usesRecycleList.value && scroller.value?.refreshLayout?.();
		};
		// append 的延迟展示：记录并转发 load-change
		const { handleLoadChange, isTailHidden } = useLazyTail(props, usesRecycleList, emit, refreshAffix);

		// 用于多选表格，切换所有行的选中状态
		const toggleAllSelection = () => {
			store.selection.toggleAll();
		};

		// 用于单选表格，设定某一行为选中行，如果调用时不加参数，则会取消目前高亮行的选中状态。
		const setCurrentRow = (row: any) => {
			store.row.set(row);
		};

		// 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
		const toggleRowSelection = (row: any, selected?: boolean, emitChange?: boolean) => {
			store.selection.toggle(row, selected, emitChange);
			store.selection.updateAllSelected();
		};

		// 用于可展开表格与树形表格，切换某一行的展开状态;如果使用了第二个参数，则是设置这一行展开与否（expanded 为 true 则展开）
		const toggleRowExpansion = (row: any, expanded?: boolean) => {
			store.toggleRowExpansion(row, expanded);
		};

		// 用于多选表格，清空用户的选择
		const clearSelection = () => {
			store.selection.clear();
		};

		const handleResize = () => {
			if (!isReady.value) return;
			let shouldUpdateLayout = false;
			const el = instance.vnode.el!;
			const { width: oldWidth, height: oldHeight } = resizeState.value;

			const width = el.offsetWidth;
			if (oldWidth !== width) {
				shouldUpdateLayout = true;
			}

			const height = el.offsetHeight;
			if (shouldUpdateHeight.value && oldHeight !== height) {
				shouldUpdateLayout = true;
			}

			if (shouldUpdateLayout) {
				resizeState.value = {
					width,
					height
				};

				updateLayout();
			}
		};

		const handleMouseLeave = () => {
			store.row.setHoverIndex(null);
		};

		// 在表头 / 底部 dock 上滚轮时转交给表体滚动；自行管理 Wheel 的挂载与卸载
		useWheelForward({ headerWrapper, bottomWrapper, bodyXWrapper, bodyScroller });

		// 不论 fit 与否都监听：fit=false 时 scrollX（及固定列阴影）同样依赖容器宽度
		const bindEvents = () => {
			Resize.on(instance.vnode.el as any, handleResize);
		};

		const unbindEvents = () => {
			Resize.off(instance.vnode.el as any, handleResize);
		};
		const debouncedUpdateLayout = debounce(() => updateLayout(), 50);

		// 把 props 同步进 store / layout；其中 immediate 的 watch 会在此处立即执行，须保持调用位置
		usePropsSync(props, store, { isReady, updateLayout });

		// 表头 / 合计行横向跟随表体，并维护根节点 is-scrolling-* 类名
		const { handleScrollX } = useScrollSync({ tableWrapper, headerWrapper, footerWrapper, bodyXWrapper, layout, props });

		const tableId = getUid('table');
		onMounted(() => {
			bindEvents();
			store.column.sortTree();
			store.updateColumns();
			updateLayout();

			resizeState.value = {
				width: (instance.vnode.el as any).offsetWidth,
				height: (instance.vnode.el as any).offsetHeight
			};

			isReady.value = true;
		});

		// 带 key 的列移动只移动 DOM、不触发列的挂载/卸载：Table 重渲染后按 DOM 顺序校正顶层列（分组内由分组列校正）
		onUpdated(() => {
			store.column.sort() && store.scheduleLayout(true);
		});

		onUnmounted(() => {
			isUnMount = true;
			unbindEvents();
		});

		const exposed = {
			bodyXWrapper,
			bodyYWrapper,
			tableId,
			store,
			layout,
			updateScrollY,
			refreshLayout,
			refreshAffix,
			toggleAllSelection,
			setCurrentRow,
			toggleRowSelection,
			toggleRowExpansion,
			clearSelection,
			scroller,
			tableWrapper,
			headerWrapper,
			appendWrapper,
			footerWrapper,
			bottomWrapper,
			barAnchor,
			resizeState,
			debouncedUpdateLayout,
			isReady,
			hiddenColumns,
			props,
			emit,
			resizeProxy,
			resizeProxyVisible
		};
		expose(exposed);
		provide('vc-table', exposed);
		return () => {
			return (
				<div
					ref={tableWrapper}
					class={[classes.value, tableId, 'vc-table']}
					style={{ '--vc-table-columns': layout.templateColumns.value }}
					role={store.tree.isTree ? 'treegrid' : 'table'}
					onMouseleave={handleMouseLeave}
				>
					<div ref={hiddenColumns} class="vc-table__hidden">
						{ slots.default?.() }
					</div>
					{
						props.showHeader && (
							<Affix ref={affixHeader} {...affixOptions.value[0]}>
								<div
									ref={headerWrapper}
									class="vc-table__header-wrapper"
								>
									<TableHeader
										border={props.border}
										resizable={props.resizable}
										sort={props.sort}
										style={bodyWidthStyle.value}
									/>
								</div>
							</Affix>
						)
					}
					{
						states.columns.length > 0 && (
							<TableBody
								ref={body}
								height-style={[bodyHeightStyle.value]}
								onScroll={handleScrollX}
								// @ts-ignore
								onLoadChange={handleLoadChange}
							>
								{
									props.data.length === 0 && (
										<div class="vc-table__empty-placeholder" style={[bodyWidthStyle.value]} />
									)
								}
								{
									slots.append && !isTailHidden.value && (
										<div ref={appendWrapper} class="vc-table__append-wrapper">
											{ slots.append() }
										</div>
									)
								}
							</TableBody>
						)
					}
					{
						// 与表体同一次渲染挂载：Affix 只在挂载时解析一次 target（表体）
						states.columns.length > 0 && (
							<Affix ref={affixFooter} {...affixOptions.value[1]}>
								<div ref={bottomWrapper} class="vc-table__bottom">
									{/* 流式高度下横向滚动条 Teleport 到这里，随 dock 吸底 */}
									<div ref={barAnchor} class="vc-table__bar-x" />
									{
										props.showSummary && (
											<div
												// @ts-ignore
												vShow={props.data && props.data.length > 0}
												ref={footerWrapper}
												class="vc-table__footer-wrapper"
											>
												<TableFooter
													sum-text={props.sumText || '合计'}
													get-summary={props.getSummary}
													style={bodyWidthStyle.value}
												/>
											</div>
										)
									}
								</div>
							</Affix>
						)
					}
					{
						props.data.length === 0 && (
							<div class="vc-table__empty-wrapper">
								{
									slots.empty
										? slots.empty()
										: (
												<span class="vc-table__empty-text">
													{ props.emptyText || '暂无数据' }
												</span>
											)
								}
							</div>
						)
					}
					<div
						// @ts-ignore
						vShow={resizeProxyVisible.value}
						ref={resizeProxy}
						class="vc-table__column-resize-proxy"
					/>
				</div>
			);
		};
	}
});
