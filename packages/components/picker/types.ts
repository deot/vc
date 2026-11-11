export type PickerValue = string | number | boolean | null | undefined;
export type PickerModelValue = PickerValue | PickerValue[];

export interface PickerData {
	[key: string]: any;
	value?: PickerValue;
	label?: any;
	// 禁用：置灰，滚动停在上面时回弹到最近的可选行，点按不响应
	disabled?: boolean;
	children?: PickerData[];
	hasChildren?: boolean;
	loading?: boolean;
}

export type PickerColumn = PickerData[];
export type PickerSource = PickerColumn | PickerColumn[];
