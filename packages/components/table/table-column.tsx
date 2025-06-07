import {
	getCurrentInstance,
	h,
	defineComponent,
	ref,
	reactive,
	watch,
	computed,
	onBeforeMount,
	onMounted,
	onUnmounted,
	Fragment
} from 'vue';
import { hasOwn, getUid } from '@deot/helper-utils';
import { merge, isEmpty } from 'lodash-es';
import { compose } from '@deot/helper-fp';
import { getInstance } from '@deot/vc-hooks';
import { cellStarts, cellForced, defaultRenderCell, treeCellPrefix } from './table-column-confg';
import { parseWidth, parseMinWidth } from './utils';

export const TableColumn = defineComponent({
	name: 'vc-table-column',
	props: {
		type: {
			type: String,
			default: 'default'
		},
		label: String,
		customClass: String,
		labelClass: String,
		prop: String,
		width: Number,
		minWidth: Number,
		renderHeader: Function,
		resizable: {
			type: Boolean,
			default: true
		},
		columnKey: String,
		align: String,
		headerAlign: String,
		showPopover: Boolean,
		fixed: [Boolean, String],
		formatter: Function,
		selectable: Function,
		reserveSelection: Boolean,
		index: [Number, Function],
		// 头部是否展示排序
		sortable: Boolean,
		// 数据过滤的选项
		filters: Array,
		// 是否支持多选
		filterMultiple: {
			type: Boolean,
			default: true
		},
		filterIcon: String,
		// 选中的数据过滤项
		filteredValue: Array,
		// 筛选弹层的样式
		filterPopupClass: String,
		// 筛选的方法
		filter: Function,

		tooltip: [String, Function]
	},
	setup(props, { slots, expose }) {
		const instance = getCurrentInstance()!;
		const table: any = getInstance('table', 'tableId');
		const parent: any = getInstance('table-column', 'columnId') || table;

		const isSubColumn = table !== parent; // 用于多久表头

		const columnId = ref((parent.exposed.tableId || parent.exposed.columnId) + getUid('column'));

		const realWidth = computed(() => {
			return parseWidth(props.width);
		});

		const realMinWidth = computed(() => {
			return parseMinWidth(props.minWidth);
		});

		const realAlign = computed(() => {
			return props.align
				? 'is-' + props.align
				: null;
		});

		const realHeaderAlign = computed(() => {
			return props.headerAlign
				? 'is-' + props.headerAlign
				: realAlign.value;
		});

		const columnConfig = reactive({});
		/**
		 * 获取当前值情况，this[key]
		 * @param args ~
		 * @returns ~
		 */
		const getPropsData = (...args) => {
			const result = args.reduce((prev, cur) => {
				if (Array.isArray(cur)) {
					cur.forEach((key) => {
						prev[key] = props[key];
					});
				}
				return prev;
			}, {});

			return result;
		};
		/**
		 * compose 1
		 * 对于特定类型的 column，某些属性不允许设置
		 * 如 type: selection | index | expand
		 * @param column ~
		 * @returns ~
		 */
		const setColumnForcedProps = (column: any) => {
			const type = column.type;
			const source = cellForced[type] || {};
			Object.keys(source).forEach((prop) => {
				const value = source[prop];
				if (value !== undefined) {
					column[prop] = prop === 'customClass'
						? `${column[prop]} ${value}`
						: value;
				}
			});
			return column;
		};

		/**
		 * compose 2
		 * column
		 * 	 -> width
		 * 	 -> minWidth
		 * @param column ~
		 * @returns ~
		 */
		const setColumnWidth = (column) => {
			if (realWidth.value) {
				column.width = realWidth.value;
			}
			if (realMinWidth.value) {
				column.minWidth = realMinWidth.value;
			}
			if (!column.minWidth) {
				column.minWidth = 80;
			}
			column.realWidth = column.width === undefined
				? column.minWidth
				: column.width;
			return column;
		};

		/**
		 * compose 3
		 * column
		 *   -> renderHeader: 渲染头部
		 *   -> renderCell: 渲染单元格
		 * owner
		 * 	 -> renderExpanded: 展开
		 * @param column ~
		 * @returns ~
		 */
		const setColumnRenders = (column: any) => {
			const specialTypes = Object.keys(cellForced);
			// renderHeader 属性不推荐使用。
			if (props.renderHeader) {
				column.renderHeader = props.renderHeader;
			} else if (specialTypes.indexOf(column.type) === -1) {
				column.renderHeader = (data) => {
					const renderHeader = slots.header;
					return renderHeader
						? renderHeader(data)
						: data?.column?.label;
				};
			}

			let originRenderCell = column.renderCell;
			// TODO: 这里的实现调整
			if (column.type === 'expand') {
				// 对于展开行，renderCell 不允许配置的。在上一步中已经设置过，这里需要简单封装一下。
				column.renderCell = (data: any) => (
					<div class="vc-table__cell">
						{ originRenderCell(data) }
					</div>
				);
				table.exposed.renderExpanded.value = (data: any) => {
					return slots.default
						? slots.default(data)
						: slots.default;
				};
			} else {
				originRenderCell = originRenderCell || defaultRenderCell;
				// 对 renderCell 进行包装
				column.renderCell = (data: any) => {
					let children: any = null;
					if (slots.default) {
						children = slots?.default?.(data);
					} else {
						children = originRenderCell(data);
					}

					let prefix: any = treeCellPrefix(data);
					const $props = {
						class: 'vc-table__cell',
						style: {}
					};
					// 存在树形数组，且当前行无箭头图标且处于当前展开列，表格对齐
					if (!isEmpty(table.exposed.store.states.treeData) && !prefix && data.isExpandColumn) {
						prefix = <span class="vc-table-un-expand__indent" />;
					}

					if (data.column.showPopover) {
						$props.class += ' vc-popover';
						$props.style = {
							width: (data.column.realWidth || data.column.width) - 1 + 'px'
						};
					}
					const { placeholder } = table.props;
					const contentPlaceholder = typeof placeholder === 'function' ? placeholder() : placeholder;
					return (
						<div {...$props}>
							{prefix}
							{children === undefined || children === '' || children === null ? contentPlaceholder : children}
						</div>
					);
				};
			}
			return column;
		};

		const registerColumn = () => {
			const defaults = {
				...cellStarts[props.type],
				id: columnId.value,
				realAlign,
				realHeaderAlign
			};

			let column = merge(defaults, getPropsData(Object.keys(props)));

			// minWidth/realWidth/renderHeader
			column = compose(setColumnRenders, setColumnWidth, setColumnForcedProps)(column);

			for (const key in column) {
				if (hasOwn(column, key)) {
					columnConfig[key] = column[key];
				}
			}
		};

		const registerWatchers = () => {
			// 赋值
			Object.keys(props).forEach(k => watch(() => props[k], v => columnConfig[k] = v));

			// 影响布局
			watch(() => props.fixed, () => {
				table.exposed.store.scheduleLayout(true);
			});
			watch(() => realWidth.value, (v) => {
				columnConfig['width'] = v;
				columnConfig['realWidth'] = v;
				table.exposed.store.scheduleLayout(false);
			});
			watch(() => realMinWidth.value, () => {
				table.exposed.store.scheduleLayout(false);
			});
		};

		onBeforeMount(() => {
			registerColumn();
			registerWatchers();
		});
		onMounted(() => {
			const children = isSubColumn
				? parent.vnode.el.children
				: parent.exposed.hiddenColumns.value.children;

			// DOM上
			const columnIndex = [...children].indexOf(instance.vnode.el);

			table.exposed.store.insertColumn(
				columnConfig,
				columnIndex,
				isSubColumn && parent.exposed.columnConfig
			);
		});

		onUnmounted(() => {
			if (!instance.parent) return;
			table.exposed.store.removeColumn(
				columnConfig,
				isSubColumn && parent.exposed.columnConfig
			);
		});

		expose({
			columnId,
			columnConfig
		});

		/**
		 * 可以计算 columnIndex(外层需要标签元素), 即h('div')
		 * this.$slots?.default?.() 用于多级表头
		 * @returns ~
		 */
		return () => {
			let children: any[] = [];

			try {
				const renderDefault: any = slots?.default?.({ row: {}, column: {}, columnIndex: -1, rowIndex: -1 });
				if (renderDefault instanceof Array) {
					for (const childNode of renderDefault) {
						if (/^vcm?-table-column$/.test(childNode.type?.name)) {
							children.push(childNode);
						} else if (childNode.type === Fragment && childNode.children instanceof Array) {
							renderDefault.push(...childNode.children);
						}
					}
				}
			} catch {
				children = [];
			}
			return h('div', children);
		};
	}
});
