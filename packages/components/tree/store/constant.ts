export const KEY_NODE = '$treeNodeId';

// 具名类型：声明文件内联 props 类型时引用这个名字，避免 `typeof` 被 API Extractor 丢掉
export interface TreeKeyValue {
	children: string;
	label: string;
	value: string;
	disabled: string;
	isLeaf: string;
}

export const KEY_VALUE: TreeKeyValue = {
	children: 'children',
	label: 'label',
	value: 'value',
	disabled: 'disabled',
	isLeaf: 'isLeaf'
};
