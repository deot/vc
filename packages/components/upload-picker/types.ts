import type { UploadCallback } from '../upload/types';

export type PickerType = 'image' | 'video' | 'audio' | 'file';

type UploadPickerCallbackName
	= 'onFileBefore'
		| 'onFileStart'
		| 'onFileSuccess'
		| 'onFileError'
		| 'onError'
		| 'onComplete';

type UploadPickerBasePayload<Name extends UploadPickerCallbackName>
	= Name extends 'onFileError'
		? Omit<Parameters<UploadCallback[Name]>[0], 'stage'> & { stage: 'upload' }
		: Parameters<UploadCallback[Name]>[0];

export type UploadPickerPayload<Name extends UploadPickerCallbackName>
	= UploadPickerBasePayload<Name> & {
		type: PickerType;
	};

/**
 * UploadPicker 在 Upload 生命周期载荷上附加当前选择器类型。
 */
export interface UploadPickerCallback {
	onFileBefore(
		payload: UploadPickerPayload<'onFileBefore'>
	): ReturnType<UploadCallback['onFileBefore']>;
	onFileStart(payload: UploadPickerPayload<'onFileStart'>): void;
	onFileSuccess(payload: UploadPickerPayload<'onFileSuccess'>): void;
	onFileError(payload: UploadPickerPayload<'onFileError'>): void;
	onError(payload: UploadPickerPayload<'onError'>): void;
	onComplete(payload: UploadPickerPayload<'onComplete'>): void;
}

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
