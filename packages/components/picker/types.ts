export type PickerValue = string | number | boolean | null | undefined;
export type PickerModelValue = PickerValue | PickerValue[];

export interface PickerData {
	[key: string]: any;
	value?: PickerValue;
	label?: any;
	children?: PickerData[];
	hasChildren?: boolean;
	loading?: boolean;
}

export type PickerColumn = PickerData[];
export type PickerSource = PickerColumn | PickerColumn[];
