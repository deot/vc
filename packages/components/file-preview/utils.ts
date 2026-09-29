import { VcInstance } from '../vc';
import type { FilePreviewData, FilePreviewFileType, FilePreviewItem } from './types';

const fileRegExps = {
	image: /\.(jpe?g|png|gif|bmp|webp|image|heic)$/i,
	video: /\.(mp4|mov|avi|mpg|mpeg|rmvb)$/i,
	audio: /\.(mp3|aac|wav|flac|ape|ogg|m4a)$/i
};

export const FILE_TYPES: FilePreviewFileType[] = ['image', 'video', 'audio', 'file'];

const isFileType = (v: any): v is FilePreviewFileType => FILE_TYPES.includes(v);

// 去掉地址中的query与hash
const stripQuery = (v: string) => (v || '').replace(/[?#].*$/, '');

/**
 * 通过文件url判断文件类型（内置规则）
 * @param v 文件url或者文件名
 * @returns ~
 */
export const getFileType = (v: string): FilePreviewFileType => {
	v = stripQuery(v).toLowerCase();
	const types = Object.keys(fileRegExps);
	for (let i = 0; i < types.length; i++) {
		const type = types[i] as any;
		if (fileRegExps[type].test(v)) {
			return type;
		}
	}
	return 'file';
};

/**
 * 优先使用全局配置VcInstance.options.FilePreview.getFileType，返回非法值时回退内置规则
 * @param v 文件url或者文件名
 * @returns ~
 */
export const resolveFileType = (v: string): FilePreviewFileType => {
	const fn = VcInstance.options.FilePreview?.getFileType;
	const type = typeof fn === 'function' ? fn(v) : null;
	return isFileType(type) ? type : getFileType(v);
};

/**
 * 通过文件url获取文件名（内置规则）：取最后一段，去掉query与hash并解码
 * @param v 文件url
 * @returns ~
 */
export const getFileName = (v: string) => {
	const name = stripQuery(v).replace(/\/+$/, '').split('/').pop() || '';
	try {
		return decodeURIComponent(name);
	} catch {
		return name;
	}
};

/**
 * 优先使用全局配置VcInstance.options.FilePreview.getFileName，返回空值时回退内置规则
 * @param v 文件url
 * @returns ~
 */
export const resolveFileName = (v: string) => {
	const fn = VcInstance.options.FilePreview?.getFileName;
	const name = typeof fn === 'function' ? fn(v) : null;
	return typeof name === 'string' && name ? name : getFileName(v);
};

export const getFileExtension = (v: string) => {
	const match = stripQuery(v).match(/\.([a-z0-9]{1,8})$/i);
	return match ? match[1].toUpperCase() : '';
};

export const normalize = (data?: FilePreviewData | null): FilePreviewItem[] => {
	const source = typeof data === 'string'
		? data.split(',')
		: Array.isArray(data) ? data : [];

	return source.reduce<FilePreviewItem[]>((pre, cur) => {
		const item = typeof cur === 'string' ? { source: cur.trim() } : cur;
		if (!item || typeof item !== 'object' || !item.source) return pre;

		pre.push({
			...item,
			type: isFileType(item.type) ? item.type : resolveFileType(item.source),
			name: item.name || resolveFileName(item.source)
		});
		return pre;
	}, []);
};
