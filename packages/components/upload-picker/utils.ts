import { getUid } from '@deot/helper-utils';

const fileRegExps = {
	image: /\.(jpe?g|png|gif|bmp|webp|image|heic)$/i,
	video: /\.(mp4|mov|avi|mpg|mpeg|rmvb)$/i,
	audio: /\.(mp3|aac|wav|flac|ape|ogg|m4a)$/i
};
type FileType = keyof typeof fileRegExps | 'file';

export const PICKER_ITEM_KEY = '__vcUploadPickerKey';

// 为排序和渲染提供内部稳定主键，不污染对外输出对象
export const withPickerItemKey = <T extends Record<string, any>>(item: T, key?: string): T => {
	Object.defineProperty(item, PICKER_ITEM_KEY, {
		value: key || item.uploadId || getUid(),
		configurable: true
	});
	return item;
};
/**
 * 通过文件url判断文件类型
 * @param v 文件url或者文件名
 * @returns ~
 */
export const getFileType = (v: string): FileType => {
	v = (v?.toLowerCase() || '').replace(/[?#].*$/, '');
	const types = Object.keys(fileRegExps);
	for (let i = 0; i < types.length; i++) {
		const type = types[i] as any;
		if (fileRegExps[type].test(v)) {
			return type;
		}
	}
	return 'file';
};

const isAvailableItem = (item: any, valueKey: string) => {
	return item?.status !== 0 && !item?.errorFlag && !!item?.[valueKey];
};

// 获取过滤上传失败及未完成项后的索引；使用分类内原始索引计算，避免相同文件地址始终命中第一项
export const getAvailableIndex = (row: any, data: any[], typeIndex: string | number, valueKey: string) => {
	if (!isAvailableItem(row, valueKey)) return -1;

	const index = Number(typeIndex);
	if (Number.isInteger(index) && index >= 0) {
		return data.slice(0, index).filter(item => isAvailableItem(item, valueKey)).length;
	}

	return data.filter(item => isAvailableItem(item, valueKey)).findIndex(item => item === row);
};

export const getAvailableValues = (data: any[], valueKey: string) => {
	return data
		.filter(item => isAvailableItem(item, valueKey))
		.map(item => item[valueKey]);
};

export const IMAGE_ACCEPTS = 'image/*';
export const VIDEO_ACCEPTS = 'video/*';
export const AUDIO_ACCEPTS = 'audio/*';
export const DOC_ACCEPTS = '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const EXCEL_ACCEPTS = '.csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PPT_ACCEPTS = '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const PDF_ACCEPTS = '.pdf,application/pdf';
export const TXT_ACCEPTS = 'text/plain';
export const HTML_ACCEPTS = 'text/html';
