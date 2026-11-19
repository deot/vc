export interface SplitterResizePayload {
	// 分隔条序号，等于它前一个面板的下标
	index: number;
	// 各面板的尺寸（px）
	sizes: number[];
}

export interface SplitterCollapseChangePayload {
	// 面板下标
	index: number;
	collapsed: boolean;
	// 各面板的尺寸（px）
	sizes: number[];
}

export interface SplitterPanelCollapsible {
	// 前一条分隔条上显示折叠按钮
	start?: boolean;
	// 后一条分隔条上显示折叠按钮
	end?: boolean;
}
