import { reactive, computed, nextTick } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';
import { parseHeight, computeGridTemplateColumns } from '../../utils';
import { VcError } from '../../../vc';
import type { Store } from '../store';
import type { TableColumnNode } from '../../table-column/table-column-node';

export class Layout {
	table: any;
	store: Store;
	states = reactive({
		height: null as number | null,
		scrollX: false,
		// 表体是否出现纵向滚动：由 table.tsx 按表体 Scroller 实测的 scrollHeight / clientHeight 维护
		scrollY: false,
		bodyWidth: null as any,
		tableHeight: null as any,
		headerHeight: 44, // Table Header Height
		appendHeight: 0, // Append Slot Height
		footerHeight: 44, // Table Footer Height
		bodyHeight: null as any, // Table Height - Table Header Height
	});

	/**
	 * grid-template-columns 唯一真源：经表根 `--vc-table-columns` CSS 变量下发，
	 * header / body 的所有 TableGrid 消费 var()，列宽变化只写表根一个节点。
	 */
	templateColumns = computed(() => computeGridTemplateColumns(this.store.states.columns));

	constructor(store: Store) {
		this.store = store;
		this.table = store.table;

		if (!this.table) {
			throw new VcError('table', 'Table Layout 必须包含table实例');
		}
	}

	/**
	 * 把 height / max-height 写到表根的内联样式上；两者共用 states.height
	 * @param value 高度，null / undefined 表示清除
	 * @param prop 样式属性
	 * @returns ~
	 */
	setHeight(value: any, prop = 'height') {
		if (IS_SERVER) return;
		const el = this.table.vnode.el;
		value = parseHeight(value);

		// 清除：移除残留的内联样式；另一者仍生效时沿用它的高度，否则重置由高度派生的布局状态
		if (value === null) {
			el && (el.style[prop] = '');
			const { height, maxHeight } = this.table.props;
			const rest = parseHeight(prop === 'height' ? maxHeight : height);
			this.states.height = rest;
			if (rest === null) {
				this.states.bodyHeight = null;
			}
			return;
		}

		this.states.height = value;
		if (!el) return nextTick(() => this.setHeight(value, prop));

		if (value) {
			el.style[prop] = `${value}px`;
			this.updateElsHeight();
		}
	}

	setMaxHeight(value: any) {
		this.setHeight(value, 'max-height');
	}

	updateElsHeight() {
		if (!this.table.exposed.isReady.value) return nextTick(() => this.updateElsHeight());
		const table = this.table.exposed;
		const headerWrapper = table.headerWrapper.value;
		const appendWrapper = table.appendWrapper.value;
		const footerWrapper = table.footerWrapper.value;

		const { showHeader } = this.table.props;
		this.states.appendHeight = appendWrapper ? appendWrapper.offsetHeight : 0;

		if (showHeader && !headerWrapper) return;
		const headerHeight = !showHeader ? 0 : headerWrapper.offsetHeight;
		this.states.headerHeight = headerHeight;

		if (showHeader && headerWrapper.offsetWidth > 0 && (this.store.states.columns || []).length > 0 && headerHeight < 2) {
			return nextTick(() => this.updateElsHeight());
		}

		const tableHeight = this.table.vnode.el.clientHeight;
		this.states.tableHeight = tableHeight;
		const footerHeight = footerWrapper ? footerWrapper.offsetHeight : 0;
		this.states.footerHeight = footerHeight;

		// footerWrapper 中margin-top: -1px
		if (this.states.height !== null) {
			this.states.bodyHeight = tableHeight - headerHeight - footerHeight + (footerWrapper ? 1 : 0);
		}
	}

	updateColumnsWidth() {
		if (IS_SERVER) return;
		const bodyWidth = this.table.vnode.el.clientWidth;
		let bodyMinWidth = 0;

		const flattenColumns = this.store.states.columns;
		const flexColumns = flattenColumns.filter(column => typeof column.states.width !== 'number');

		const { fit } = this.table.props;

		if (flexColumns.length > 0 && fit) {
			flattenColumns.forEach((column) => {
				bodyMinWidth += column.states.width || column.states.minWidth || 80;
			});

			if (bodyMinWidth <= bodyWidth) {
				this.states.scrollX = false;

				const totalFlexWidth = bodyWidth - bodyMinWidth;

				if (flexColumns.length === 1) {
					flexColumns[0].states.realWidth = (flexColumns[0].states.minWidth || 80) + totalFlexWidth;
				} else {
					const allColumnsWidth = flexColumns.reduce((prev: number, column) => prev + (column.states.minWidth || 80), 0);
					const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
					let noneFirstWidth = 0;

					flexColumns.forEach((column, index) => {
						if (index === 0) return;
						const flexWidth = Math.floor((column.states.minWidth || 80) * flexWidthPerPixel);
						noneFirstWidth += flexWidth;
						column.states.realWidth = (column.states.minWidth || 80) + flexWidth;
					});

					flexColumns[0].states.realWidth = (flexColumns[0].states.minWidth || 80) + totalFlexWidth - noneFirstWidth;
				}
			} else { // HAVE HORIZONTAL SCROLL BAR
				this.states.scrollX = true;
				flexColumns.forEach((column) => {
					column.states.realWidth = column.states.width || column.states.minWidth;
				});
			}

			this.states.bodyWidth = Math.max(bodyMinWidth, bodyWidth);
		} else {
			flattenColumns.forEach((column) => {
				if (!column.states.width && !column.states.minWidth) {
					column.states.realWidth = 80;
				} else {
					column.states.realWidth = column.states.width || column.states.minWidth;
				}

				bodyMinWidth += column.states.realWidth!;
			});

			this.states.scrollX = bodyMinWidth > bodyWidth;

			// fit：列宽之和不足表格宽度时，剩余宽度交给撑满列（见 getFillColumn）；
			// 写进 realWidth，表头 / 表体 / 合计行共用的 grid 模板与 sticky 偏移都由它得出
			const target = fit && bodyMinWidth < bodyWidth ? this.getFillColumn() : void 0;
			if (target) {
				target.states.realWidth! += bodyWidth - bodyMinWidth;
				this.states.bodyWidth = bodyWidth;
			} else {
				this.states.bodyWidth = bodyMinWidth;
			}
		}

		this.syncStickyOffsets();
	}

	/**
	 * 吸收剩余宽度的列：从后往前第一个没被用户拖动过的非固定叶子列（全是固定列时在全部列中找）
	 *
	 * 拖动过的列保持拖动后的宽度，否则拖窄撑满列时剩余宽度又会补回给它；都拖动过时不撑满。
	 * cloneVisibleTree 保留叶子列的原引用，这里拿到的即 store.states.columns 中的节点
	 * @returns 叶子列，没有可用的列时为 undefined
	 */
	getFillColumn() {
		const { leafColumns = [], columns = [] } = this.store.states;
		const candidates = leafColumns.length ? leafColumns : columns;
		for (let i = candidates.length - 1; i >= 0; i--) {
			if (!candidates[i].states.resized) return candidates[i];
		}
	}

	/**
	 * 提前计算固定列的 sticky 偏移并写到列节点 states 上（包含分组列及其子列），渲染层（header /
	 * body-row / footer）从 column.stickyStyle / column.stickyClass 直接消费即可。
	 * 	- 偏移按叶子宽度累加（右侧从最右往左）：分组列取其首个（左）/ 末个（右）叶子的偏移；
	 * 	- 与滚动区交界的叶子（左侧最后一个、右侧第一个）及包含它的分组列带阴影类；
	 * 	- 非固定列（含子列）上的 sticky 信息一并清除，避免列从 fixed 切换为非 fixed 时残留。
	 */
	syncStickyOffsets() {
		const { leftFixedColumns = [], rightFixedColumns = [], notFixedColumns = [] } = this.store.states;

		const apply = (columns: TableColumnNode[], side: 'left' | 'right') => {
			let offset = 0;
			// edge: 父级是否位于交界路径上（顶层视为是）；按累加方向排列时，交界列是每层的最后一个
			const walk = (nodes: TableColumnNode[], edge: boolean) => {
				const list = side === 'left' ? nodes : [...nodes].reverse();
				list.forEach((column, index) => {
					const isEdge = edge && index === list.length - 1;
					const start = offset;
					if (column.childNodes.length) {
						walk(column.childNodes, isEdge);
					} else {
						offset += column.states.realWidth || column.states.width || 0;
					}
					column.states.stickyOffset = start;
					if (side === 'left') {
						column.states.stickyStyle = { position: 'sticky', left: `${start}px` };
						column.states.stickyClass = 'is-fixed-left' + (isEdge ? ' is-fixed-left-tail' : '');
					} else {
						column.states.stickyStyle = { position: 'sticky', right: `${start}px` };
						column.states.stickyClass = 'is-fixed-right' + (isEdge ? ' is-fixed-right-head' : '');
					}
				});
			};
			walk(columns, true);
		};

		const clear = (nodes: TableColumnNode[]) => {
			nodes.forEach((column) => {
				column.states.stickyOffset = void 0;
				column.states.stickyStyle = void 0;
				column.states.stickyClass = void 0;
				column.childNodes.length && clear(column.childNodes);
			});
		};

		apply(leftFixedColumns, 'left');
		apply(rightFixedColumns, 'right');
		clear(notFixedColumns);
	}
}
