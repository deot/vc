import type { ComponentInternalInstance } from 'vue';
import type { UploadCallback } from '../upload/types';
import type { FilePreviewFileType } from '../file-preview/types';

export type PickerType = FilePreviewFileType;

/**
 * 上传入口的增强：返回真值表示已自行处理，不再打开原生选择
 * type 为这次要选的类型；桌面端有多种类型时一次选择所有类型，type 为空，types 为可选的类型
 */
export type PickerEnhancer = (data: { instance: ComponentInternalInstance; type?: PickerType; types: PickerType[] }) => any;

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
	// 唯一入口（多种类型一次选择）校验不通过时 type 为空
	onError(payload: UploadPickerBasePayload<'onError'> & { type?: PickerType }): void;
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
