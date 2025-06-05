import { reactive, nextTick, onMounted, onUpdated } from 'vue';
import { IS_SERVER } from '@deot/vc-shared';
import { parseHeight } from '../utils';
import { VcError } from '../../vc';
import type { Store } from './store';

export class Layout {
	table: any;
	store: Store;
	states = reactive({
		height: null,
		scrollX: false,
		scrollY: false,
		bodyWidth: null as any,
		leftFixedWidth: null as any,
		rightFixedWidth: null as any,
		tableHeight: null as any,
		headerHeight: 44, // Table Header Height
		appendHeight: 0, // Append Slot Height
		footerHeight: 44, // Table Footer Height
		bodyHeight: null as any, // Table Height - Table Header Height
	});

	constructor(store: Store) {
		this.store = store;
		this.table = store.table;

		if (!this.table) {
			throw new VcError('table', 'Table Layout 必须包含table实例');
		}
		if (!this.store) {
			throw new VcError('table', 'Table Layout 必须包含store实例');
		}

		this.updateScroller = this.updateScroller.bind(this);
		this.updateColumns = this.updateColumns.bind(this);

		// TODO: remove
		onMounted(() => {
			this.updateColumns();
			this.updateScroller();
		});

		let __updated__;
		onUpdated(() => {
			if (__updated__) return;
			this.updateColumns();
			this.updateScroller();
			__updated__ = true;
		});
	}

	updateScrollY() {
		const { height, bodyHeight } = this.states;
		if (height === null || bodyHeight === null) return;
		const scroller = this.table.exposed.scroller.value;
		if (this.table.vnode.el && scroller) {
			const body = scroller.$el.querySelector('.vc-table__body');
			this.states.scrollY = body.offsetHeight > bodyHeight;
		}
	}

	setHeight(value: any, prop = 'height') {
		if (IS_SERVER) return;
		const el = this.table.vnode.el;
		value = parseHeight(value);
		this.states.height = value;

		if (!el && (value || value === 0)) return nextTick(() => this.setHeight(value, prop));

		if (value) {
			el.style[prop] = `${value}px`;
			this.updateElsHeight();
		}
	}

	setMaxHeight(value: any) {
		this.setHeight(value, 'max-height');
	}

	getFlattenColumns() {
		const flattenColumns: any[] = [];
		const columns: any[] = this.store.states.columns;
		columns.forEach((column) => {
			if (column.isColumnGroup) {
				flattenColumns.push(...column.columns);
			} else {
				flattenColumns.push(column);
			}
		});

		return flattenColumns;
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

		this.updateScrollY();
		this.updateScroller();
	}

	updateColumnsWidth() {
		if (IS_SERVER) return;
		const bodyWidth = this.table.vnode.el.clientWidth;
		let bodyMinWidth = 0;

		const flattenColumns = this.getFlattenColumns();
		const flexColumns = flattenColumns.filter(column => typeof column.width !== 'number');

		const { fit } = this.table.props;

		if (flexColumns.length > 0 && fit) {
			flattenColumns.forEach((column) => {
				bodyMinWidth += column.width || column.minWidth || 80;
			});

			if (bodyMinWidth <= bodyWidth) {
				this.states.scrollX = false;

				const totalFlexWidth = bodyWidth - bodyMinWidth;

				if (flexColumns.length === 1) {
					flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth;
				} else {
					const allColumnsWidth = flexColumns.reduce((prev, column) => prev + (column.minWidth || 80), 0);
					const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
					let noneFirstWidth = 0;

					flexColumns.forEach((column, index) => {
						if (index === 0) return;
						const flexWidth = Math.floor((column.minWidth || 80) * flexWidthPerPixel);
						noneFirstWidth += flexWidth;
						column.realWidth = (column.minWidth || 80) + flexWidth;
					});

					flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth - noneFirstWidth;
				}
			} else { // HAVE HORIZONTAL SCROLL BAR
				this.states.scrollX = true;
				flexColumns.forEach(function (column) {
					column.realWidth = column.width || column.minWidth;
				});
			}

			this.states.bodyWidth = Math.max(bodyMinWidth, bodyWidth);
			this.table.exposed.resizeState.value.width = this.states.bodyWidth;
		} else {
			flattenColumns.forEach((column) => {
				if (!column.width && !column.minWidth) {
					column.realWidth = 80;
				} else {
					column.realWidth = column.width || column.minWidth;
				}

				bodyMinWidth += column.realWidth;
			});

			this.states.scrollX = bodyMinWidth > bodyWidth;
			this.states.bodyWidth = bodyMinWidth;
		}

		const fixedColumns = this.store.states.fixedColumns;

		if (fixedColumns.length > 0) {
			let leftFixedWidth = 0;
			fixedColumns.forEach(function (column) {
				leftFixedWidth += column.realWidth || column.width;
			});

			this.states.leftFixedWidth = leftFixedWidth;
		}

		const rightFixedColumns = this.store.states.rightFixedColumns;
		if (rightFixedColumns.length > 0) {
			let rightFixedWidth = 0;
			rightFixedColumns.forEach(function (column) {
				rightFixedWidth += column.realWidth || column.width;
			});

			this.states.rightFixedWidth = rightFixedWidth;
		}

		this.updateColumns();
	}

	// v2.x中的 notifyObservers
	updateColumns() {}

	updateScroller() {}
}
