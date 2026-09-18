import type { TableColumnNode } from '../table-column/table-column-node';

/**
 * 展开列树为叶子列节点数组
 * @param nodes 列树
 * @returns 叶子列节点
 */
export const flattenColumnNodes = <T extends TableColumnNode>(nodes: readonly T[]): T[] => {
	const result: T[] = [];
	nodes.forEach((node) => {
		if (node.childNodes.length) {
			result.push(...flattenColumnNodes(node.childNodes as T[]));
		} else {
			result.push(node);
		}
	});
	return result;
};

/**
 * 存在副作用
 * 对 statusArr 做添加和删除的操作
 * @param statusArr 状态数组（如 selection）
 * @param row 目标行数据
 * @param newVal 指定选中与否；省略时切换
 * @param batch 为 true 时，使用 delete（批处理使用 splice 性能差，使用 delete 后统一再处理）
 * @returns 是否发生变更
 */
export const toggleRowStatus = (statusArr: any, row: any, newVal: any, batch = false) => {
	let changed = false;
	const index = statusArr.indexOf(row);
	const included = index !== -1;

	const addRow = () => {
		statusArr.push(row);
		changed = true;
	};
	const removeRow = () => {
		if (!batch) {
			statusArr.splice(index, 1);
		} else {
			delete statusArr[index];
		}
		changed = true;
	};

	if (typeof newVal === 'boolean') {
		if (newVal && !included) {
			addRow();
		} else if (!newVal && included) {
			removeRow();
		}
	} else {
		included ? removeRow() : addRow();
	}
	return changed;
};
