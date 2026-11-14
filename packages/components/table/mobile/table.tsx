import { defineComponent } from 'vue';
import { emits as tableEmits } from '../table-props';
import { props as tableProps } from './table-props';
import { useTable } from '../hooks/use-table';
import type { TableComponents } from '../types';
import { MAffix } from '../../affix/index.m';
import { MCheckbox } from '../../checkbox/index.m';
import { MPopover } from '../../popover/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MScroller } from '../../scroller/index.m';
import { MSpin } from '../../spin/index.m';
import { MTableFilter } from './table-filter';

const COMPONENT_NAME = 'vcm-table';

const components = {
	Affix: MAffix,
	Checkbox: MCheckbox,
	Filter: MTableFilter,
	Popover: MPopover,
	RecycleList: MRecycleList,
	Scroller: MScroller,
	Spin: MSpin
} as unknown as TableComponents;

/**
 * 移动端表格：同 Table，根节点另有标记类 vcm-table
 * 1. 数字 width / height / maxHeight / rowHeight / indent 与列的数字 width / minWidth 为 750 稿长度，随 --vc-rem 缩放；字符串（如 '120px'）不换算
 * 2. 内部的滚动容器、虚拟列表、固钉、多选框为移动端的版本：表体使用原生滚动与系统滚动条
 * 3. 触屏交互：点可排序的表头按 升序 → 降序 → 取消 循环；筛选从底部弹出；点被截断的单元格 / 表头文字弹出完整内容；
 *    没有行悬停高亮，不支持拖动调整列宽（resizable 不生效）
 */
export const MTable = defineComponent({
	name: COMPONENT_NAME,
	props: tableProps,
	emits: [...tableEmits],
	setup(props, context) {
		return useTable(props, context, { mobile: true, components });
	}
});
