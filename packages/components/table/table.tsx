/** @jsxImportSource vue */

import { defineComponent, provide, watch, computed, ref, getCurrentInstance, nextTick, onMounted, onUnmounted } from 'vue';
import { debounce, throttle } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
import { getUid, raf } from '@deot/helper-utils';
import { Wheel } from '@deot/helper-wheel';
import { parseHeight } from './utils';

import { Store, useStates } from './store';

// Table
import { TableBody } from './table-body';
import { TableHeader } from './table-header';
import { TableFooter } from './table-footer';

import { ScrollerWheel } from '../scroller';
import { props as tableProps } from './table-props';

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
		'row-click',
		'row-contextmenu',
		'row-dblclick',
		'header-click',
		'header-contextmenu',
		'current-change',
		'header-dragend ',
		'expand-change',
		'sort-change'
	],
	setup(props, { slots, expose, emit }) {
		const instance = getCurrentInstance()!;

		const store: any = new Store({ table: instance });
		const { layout } = store;

		// 由table-column控制
		const renderExpanded = ref(null);
		const resizeProxyVisible = ref(false);
		const resizeState = ref({
			width: null,
			height: null
		});

		// refs
		const hiddenColumns = ref<any>(null);
		const headerWrapper = ref<any>(null);
		const tableHeader = ref<any>(null);
		const scroller = ref<any>(null);

		const body = ref<any>();
		const emptyBlock = ref<any>(null);
		const appendWrapper = ref<any>(null);
		const footerWrapper = ref<any>(null);

		const leftFixedWrapper = ref<any>(null);
		const leftFixedHeaderWrapper = ref<any>(null);
		const leftFixedTableHeader = ref<any>(null);
		const leftFixedBodyWrapper = ref<any>(null);
		const leftFixedBody = ref<any>(null);
		const leftFixedFooterWrapper = ref<any>(null);

		const rightFixedWrapper = ref<any>(null);
		const rightFixedHeaderWrapper = ref<any>(null);
		const rightFixedTableHeader = ref<any>(null);
		const rightFixedBodyWrapper = ref<any>(null);
		const rightFixedBody = ref<any>(null);
		const rightFixedFooterWrapper = ref<any>(null);

		const resizeProxy = ref(null);

		const scrollPosition = ref('left');
		const hoverState = ref(null);
		const isReady = ref(false);

		const states: any = useStates({
			columns: 'columns',
			leftFixedColumns: 'leftFixedColumns',
			rightFixedColumns: 'rightFixedColumns',
			isGroup: 'isGroup'
		}, store);

		const classes = computed(() => {
			return {
				'vc-table--fit': props.fit,
				'vc-table--striped': props.stripe,
				'vc-table--border': props.border || states.isGroup,
				'vc-table--group': states.isGroup,
				'vc-table--fluid-height': props.maxHeight,
				'vc-table--scrollable-x': layout.states.scrollX,
				'vc-table--scrollable-y': layout.states.scrollY,
				'vc-table--enable-row-hover': !store.states.isComplex,
				'vc-table--enable-row-transition': (store.states.data || []).length !== 0 && (store.states.data || []).length < 100
			};
		});

		const bodyXWrapper = computed(() => {
			return scroller.value?.wrapper;
		});

		const bodyYWrapper = computed(() => {
			return !props.height
				? bodyXWrapper.value
				: body.value.getRootElement().querySelector('.vc-scroller__wrapper');
		});

		const shouldUpdateHeight = computed(() => {
			return props.height
				|| props.maxHeight
				|| states.leftFixedColumns.length > 0
				|| states.rightFixedColumns.length > 0;
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

		const fixedHeightStyle = computed(() => {
			if (props.maxHeight) {
				if (props.showSummary) {
					return {
						bottom: 0
					};
				}
				return {
					bottom: (layout.states.scrollX && props.data.length) ? 0 : ''
				};
			} else {
				if (props.showSummary) {
					return {
						height: layout.states.tableHeight ? layout.states.tableHeight + 'px' : ''
					};
				}
				return {
					height: layout.states.viewportHeight ? layout.states.viewportHeight + 'px' : ''
				};
			}
		});

		let isUnMount = false;
		const updateScrollY = () => {
			if (isUnMount) return;
			layout.updateScrollY();
			layout.updateColumnsWidth();
		};

		/**
		 * 对 Table 进行重新布局。
		 * 当 Table 或其祖先元素由隐藏切换为显示时，可能需要调用此方法
		 */
		const refreshLayout = () => {
			if (isUnMount) return;

			layout.updateColumnsWidth();
			if (shouldUpdateHeight.value) {
				layout.updateElsHeight();
			}

			scroller.value?.refresh?.();
		};
		// 用于多选表格，切换所有行的选中状态
		const toggleAllSelection = () => {
			store.toggleAllSelection();
		};

		// 用于单选表格，设定某一行为选中行，如果调用时不加参数，则会取消目前高亮行的选中状态。
		const setCurrentRow = (row: any) => {
			store.setCurrentRow(row);
		};

		// 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
		const toggleRowSelection = (row: any, selected?: boolean, emitChange?: boolean) => {
			store.toggleRowSelection(row, selected, emitChange);
			store.updateAllSelected();
		};

		// 用于可展开表格与树形表格，切换某一行的展开状态;如果使用了第二个参数，则是设置这一行展开与否（expanded 为 true 则展开）
		const toggleRowExpansion = (row: any, expanded?: boolean) => {
			store.toggleRowExpansionAdapter(row, expanded);
		};

		// 用于多选表格，清空用户的选择
		const clearSelection = () => {
			store.clearSelection();
		};

		// 同步滚动
		const handleScollX = throttle(() => {
			if (!bodyXWrapper.value) return;
			const { scrollLeft, offsetWidth, scrollWidth } = bodyXWrapper.value;
			if (headerWrapper.value) headerWrapper.value.scrollLeft = scrollLeft;
			if (footerWrapper.value) footerWrapper.value.scrollLeft = scrollLeft;
			const maxScrollLeftPosition = scrollWidth - offsetWidth - 1;
			if (scrollLeft >= maxScrollLeftPosition) {
				scrollPosition.value = 'right';
			} else if (scrollLeft === 0) {
				scrollPosition.value = 'left';
			} else {
				scrollPosition.value = 'middle';
			}
			if (!props.height) {
				leftFixedBody.value.getRootElement().scrollTop = (bodyXWrapper.value.scrollTop);
				rightFixedBody.value.getRootElement().scrollTop = (bodyXWrapper.value.scrollTop);
			}
		}, 20);

		const handleScollY = (e: any) => {
			const v = {
				x: e.target.scrollLeft,
				y: e.target.scrollTop,
			};
			rightFixedBody.value?.wrapper.scrollTo(v, true);
			leftFixedBody.value?.wrapper.scrollTo(v, true);
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
			if ((props.height || shouldUpdateHeight.value) && oldHeight !== height) {
				shouldUpdateLayout = true;
			}

			if (shouldUpdateLayout) {
				resizeState.value = {
					width,
					height
				};

				refreshLayout();
			}
		};

		const handleMouseLeave = () => {
			store.setHoverRow(null);
			if (hoverState.value) hoverState.value = null;
		};

		const handleMousewheel = (deltaX: number, deltaY: number) => {
			const {
				scrollWidth: contentW,
				clientWidth: wrapperW,
				scrollLeft: scrollX
			} = bodyXWrapper.value;
			const {
				scrollHeight: contentH,
				clientHeight: wrapperH,
				scrollTop: scrollY
			} = bodyYWrapper.value;

			if (
				Math.abs(deltaY) > Math.abs(deltaX)
				&& contentH > wrapperH
			) {
				// 虚拟滚动
				if (props.height) {
					body.value.wrapper?.scrollTo({ y: scrollY + deltaY });
				} else {
					scroller.value.scrollTo({ y: scrollY + deltaY });
				}
			} else if (deltaX && contentW > wrapperW) {
				scroller.value.scrollTo({ x: scrollX + deltaX });
			}
		};
		let wheels: any[] = [];

		const bindEvents = () => {
			if (props.fit) {
				Resize.on(instance.vnode.el as any, handleResize);
			}
			nextTick(() => {
				wheels = [headerWrapper, footerWrapper, leftFixedWrapper, rightFixedWrapper].map((wrapper) => {
					if (!wrapper.value) return;
					const wheel = new Wheel(wrapper.value, {
						shouldWheelX: (delta) => {
							const {
								scrollWidth: contentW,
								clientWidth: wrapperW,
								scrollLeft: scrollX
							} = bodyXWrapper.value;
							if (wrapperW === contentW) {
								return false;
							}

							delta = Math.round(delta);
							if (delta === 0) {
								return false;
							}

							return (
								(delta < 0 && scrollX > 0)
								|| (delta >= 0 && scrollX < contentW - wrapperW)
							);
						},
						shouldWheelY: (delta) => {
							const {
								scrollHeight: contentH,
								clientHeight: wrapperH,
								scrollTop: scrollY
							} = bodyYWrapper.value;

							if (wrapperH === contentH) {
								return false;
							}

							delta = Math.round(delta);
							if (delta === 0) {
								return false;
							}
							return (
								(delta < 0 && scrollY > 0)
								|| (delta >= 0 && scrollY < contentH - wrapperH)
							);
						}
					});
					wheel.on(handleMousewheel);
					return wheel;
				});
			});
		};

		const unbindEvents = () => {
			if (props.fit) {
				Resize.off(instance.vnode.el as any, handleResize);
			}
			wheels.forEach(wheel => wheel && wheel.off(handleMousewheel));
		};
		const debouncedUpdateLayout = debounce(() => refreshLayout(), 50);

		watch(
			() => props.height,
			(v) => {
				layout.setHeight(v);
			},
			{ immediate: true }
		);

		watch(
			() => props.maxHeight,
			(v) => {
				layout.setMaxHeight(v);
			},
			{ immediate: true }
		);

		watch(
			() => props.currentRowValue,
			(v) => {
				if (!props.primaryKey) return;
				store.current.reset(v);
			},
			{ immediate: true }
		);

		watch(
			() => [props.data, props.data.length],
			() => {
				store.setData(props.data);
				isReady.value && nextTick(refreshLayout);
			},
			{ immediate: true }
		);

		watch(
			() => props.expandRowValue,
			(v) => {
				if (v) {
					store.setExpandRowValueAdapter(v);
				}
			},
			{ immediate: true }
		);

		// 直接修改className（不使用render函数）, 解决临界值设置修改className时的顿挫
		watch(
			() => scrollPosition.value,
			(v) => {
				raf(() => {
					const className = `is-scrolling-${layout.states.scrollX ? v : 'none'}`;
					const el = bodyXWrapper.value;
					el && el.classList.replace(
						el.classList.item(el.classList.length - 1),
						className
					);
				});
			},
			{ immediate: true }
		);

		const tableId = getUid('table');
		onMounted(() => {
			bindEvents();
			store.updateColumns();
			refreshLayout();

			resizeState.value = {
				width: (instance.vnode.el as any).offsetWidth,
				height: (instance.vnode.el as any).offsetHeight
			};

			isReady.value = true;
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
			toggleAllSelection,
			setCurrentRow,
			toggleRowSelection,
			toggleRowExpansion,
			clearSelection,
			scroller,
			headerWrapper,
			appendWrapper,
			footerWrapper,
			resizeState,
			debouncedUpdateLayout,
			isReady,
			hoverState,
			renderExpanded,
			hiddenColumns,
			props,
			emit
		};
		expose(exposed);
		provide('vc-table', exposed);
		return () => {
			return (
				<div
					class={[classes.value, tableId, 'vc-table']}
					onMouseleave={handleMouseLeave}
				>
					<div ref={hiddenColumns} class="vc-table__hidden">
						{ slots.default?.() }
					</div>
					{
						props.showHeader && (
							<div
								ref={headerWrapper}
								class="vc-table__header-wrapper"
							>
								<TableHeader
									ref={tableHeader}
									store={store}
									border={props.border}
									default-sort={props.defaultSort}
									style={bodyWidthStyle.value}
								/>
							</div>
						)
					}
					{
						states.columns.length > 0 && (
							<ScrollerWheel
								ref={scroller}
								class={['vc-table__body-wrapper is-scrolling-none']}
								barTo={`.${tableId}`}
								native={false}
								always={false}
								track-offset-y={[
									layout.states.headerHeight,
									0,
									-layout.states.headerHeight - layout.states.footerHeight,
									0
								]}
								style={[bodyHeightStyle.value]}
								onScroll={handleScollX}
							>
								<TableBody
									ref={body}
									store={store}
									style={[bodyWidthStyle.value]}
									height-style={[bodyHeightStyle.value]}
									// @ts-ignore
									onScroll={handleScollY}
								/>
								{
									props.data.length === 0 && (
										<div
											ref={emptyBlock}
											style={bodyWidthStyle.value}
											class="vc-table__empty-block"
										>
											<span class="vc-table__empty-text">
												{ slots.empty ? slots.empty() : (props.emptyText || '暂无数据') }
											</span>
										</div>
									)
								}
								{
									slots.append && (
										<div
											ref={appendWrapper}
											class="vc-table__append-wrapper"
										>
											{ slots.append() }
										</div>
									)
								}
							</ScrollerWheel>
						)
					}
					{
						props.showSummary && (
							<div
								// @ts-ignore
								vShow={props.data && props.data.length > 0}
								ref={footerWrapper}
								class="vc-table__footer-wrapper"
							>
								<TableFooter
									store={store}
									border={props.border}
									sum-text={props.sumText || '合计'}
									get-summary={props.getSummary}
									style={bodyWidthStyle.value}
								/>
							</div>
						)
					}
					{
						states.leftFixedColumns.length > 0 && states.columns.length > 0 && (
							<div
								ref={leftFixedWrapper}
								style={[{ width: layout.states.leftFixedWidth ? layout.states.leftFixedWidth + 'px' : '' }, fixedHeightStyle.value]}
								class="vc-table__fixed"
							>
								{
									props.showHeader && (
										<div
											ref={leftFixedHeaderWrapper}
											class="vc-table__fixed-header-wrapper"
										>
											<TableHeader
												ref={leftFixedTableHeader}
												store={store}
												border={props.border}
												default-sort={props.defaultSort}
												style={bodyWidthStyle.value}
												fixed="left"
											/>
										</div>
									)
								}
								<div
									ref={leftFixedBodyWrapper}
									style={[{ top: layout.states.headerHeight + 'px' }]}
									class="vc-table__fixed-body-wrapper"
								>
									<TableBody
										ref={leftFixedBody}
										store={store}
										style={[bodyWidthStyle.value, bodyHeightStyle.value]}
										fixed="left"
									/>
									{
										slots.append && (
											<div
												style={[{ height: layout.states.appendHeight + 'px' }]}
												class="vc-table__append-gutter"
											>
												{ slots.append() }
											</div>
										)
									}
								</div>
								{
									props.showSummary && (
										<div
											// @ts-ignore
											vShow={props.data && props.data.length > 0}
											ref={leftFixedFooterWrapper}
											class="vc-table__fixed-footer-wrapper"
										>
											<TableFooter
												store={store}
												border={props.border}
												sum-text={props.sumText || '合计'}
												get-summary={props.getSummary}
												style={bodyWidthStyle.value}
												fixed="left"
											/>
										</div>
									)
								}
							</div>
						)
					}
					{
						states.rightFixedColumns.length > 0 && (
							<div
								ref={rightFixedWrapper}
								style={[{ width: layout.states.rightFixedWidth ? layout.states.rightFixedWidth + 'px' : '' }, fixedHeightStyle.value]}
								class="vc-table__fixed-right"
							>
								{
									props.showHeader && (
										<div
											ref={rightFixedHeaderWrapper}
											class="vc-table__fixed-header-wrapper"
										>
											<TableHeader
												ref={rightFixedTableHeader}
												store={store}
												border={props.border}
												default-sort={props.defaultSort}
												style={bodyWidthStyle.value}
												fixed="right"
											/>
										</div>
									)
								}
								<div
									ref={rightFixedBodyWrapper}
									style={[
										{
											top: layout.states.headerHeight + 'px'
										}
									]}
									class="vc-table__fixed-body-wrapper"
								>
									<TableBody
										ref={rightFixedBody}
										store={store}
										style={[bodyWidthStyle.value, bodyHeightStyle.value]}
										fixed="right"
									/>
									{
										slots.append && (
											<div
												style={[{ height: layout.states.appendHeight + 'px' }]}
												class="vc-table__append-gutter"
											>
												{ slots.append() }
											</div>
										)
									}
								</div>
								{
									props.showSummary && (
										<div
											// @ts-ignore
											vShow={props.data && props.data.length > 0}
											ref={rightFixedFooterWrapper}
											class="vc-table__fixed-footer-wrapper"
										>
											<TableFooter
												store={store}
												border={props.border}
												sum-text={props.sumText || '合计'}
												get-summary={props.getSummary}
												style={bodyWidthStyle.value}
												fixed="right"
											/>
										</div>
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
