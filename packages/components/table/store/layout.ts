import { reactive, nextTick } from 'vue';
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
	}

	updateScrollY() {
		const { height, bodyHeight } = this.states;
		if (height === null || bodyHeight === null) return;
		const bodyYWrapper = this.table.exposed.bodyYWrapper.value;
		if (this.table.vnode.el && bodyYWrapper) {
			this.states.scrollY = bodyYWrapper.offsetHeight > bodyHeight;
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
	}

	updateColumnsWidth() {
		if (IS_SERVER) return;
		const bodyWidth = this.table.vnode.el.clientWidth;
		let bodyMinWidth = 0;

		const flattenColumns = this.store.states.columns;
		const flexColumns = flattenColumns.filter((column: any) => typeof column.width !== 'number');

		const { fit } = this.table.props;

		if (flexColumns.length > 0 && fit) {
			flattenColumns.forEach((column: any) => {
				bodyMinWidth += column.width || column.minWidth || 80;
			});

			if (bodyMinWidth <= bodyWidth) {
				this.states.scrollX = false;

				const totalFlexWidth = bodyWidth - bodyMinWidth;

				if (flexColumns.length === 1) {
					flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth;
				} else {
					const allColumnsWidth = flexColumns.reduce((prev: number, column: any) => prev + (column.minWidth || 80), 0);
					const flexWidthPerPixel = totalFlexWidth / allColumnsWidth;
					let noneFirstWidth = 0;

					flexColumns.forEach((column: any, index: number) => {
						if (index === 0) return;
						const flexWidth = Math.floor((column.minWidth || 80) * flexWidthPerPixel);
						noneFirstWidth += flexWidth;
						column.realWidth = (column.minWidth || 80) + flexWidth;
					});

					flexColumns[0].realWidth = (flexColumns[0].minWidth || 80) + totalFlexWidth - noneFirstWidth;
				}
			} else { // HAVE HORIZONTAL SCROLL BAR
				this.states.scrollX = true;
				flexColumns.forEach((column: any) => {
					column.realWidth = column.width || column.minWidth;
				});
			}

			this.states.bodyWidth = Math.max(bodyMinWidth, bodyWidth);
			this.table.exposed.resizeState.value.width = this.states.bodyWidth;
		} else {
			flattenColumns.forEach((column: any) => {
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

		const leftFixedColumns = this.store.states.leftFixedColumns;

		if (leftFixedColumns.length > 0) {
			let leftFixedWidth = 0;
			leftFixedColumns.forEach(function (column) {
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
	}
}
