export type PickerType = 'image' | 'video' | 'audio' | 'file';

export interface PickerItem {
	type: PickerType;
	label?: string;
	value?: string;
	uid?: string;
	uploadId?: string;
	name?: string;
	percent?: number | string | null;
	status?: number;
	errorFlag?: boolean | number;
	[key: string]: any;
}
