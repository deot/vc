/**
 * 单元格描述（由调用方预处理好，getSpan 等业务求值在外部完成）。
 * 组件内部只认坐标 + span，不感知 row/column 业务对象；
 * 被覆盖（skip）的格子不传入即可，组件不渲染它们。
 */
export interface TableGridCell {
	// 唯一 key，缺省用 `${rowIndex}:${columnIndex}`
	key?: string | number;
	// 绝对行号（配合 rowStart 映射为 grid 行号）
	rowIndex: number;
	// 列号（叶子列坐标）
	columnIndex: number;
	// 跨行数，默认 1
	rowspan?: number;
	// 跨列数，默认 1
	colspan?: number;
	// 额外 class（sticky class、业务 class 等由调用方合并好传入）
	class?: any;
	// 额外 style（sticky style、业务 style 等由调用方合并好传入）
	style?: any;
	// 透传到 cell 根节点的 attrs / 事件（data-row / data-column 等）
	attrs?: Record<string, any>;
	// cell 内容渲染插槽
	render?: (cell: TableGridCell) => any;
};
