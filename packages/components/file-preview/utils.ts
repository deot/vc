import { VcInstance, VirtualElement } from '../vc';
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

const DATA_URL_HEADER = /^data:([^,]*),/i;

/**
 * 解析 data: 地址的头部，不解码内容；不是 data: 地址时为undefined
 * @param source ~
 * @returns mime 为小写、不含参数的媒体类型，type 为保留参数（如 charset）的 Blob 类型
 */
export const parseDataUrl = (source: string) => {
	const match = DATA_URL_HEADER.exec(source || '');
	if (!match) return;
	const params = match[1].split(';').map(v => v.trim()).filter(Boolean);
	const base64 = params[params.length - 1]?.toLowerCase() === 'base64';
	if (base64) params.pop();
	// 省略媒体类型时按规范为 text/plain
	if (!params[0] || params[0].includes('=')) params.unshift('text/plain');
	return {
		mime: params[0].toLowerCase(),
		type: params.join(';'),
		base64,
		body: source.slice(match[0].length)
	};
};

// 子类型与常用扩展名不一致的媒体类型；其余直接取子类型
const DATA_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/svg+xml': 'svg',
	'image/x-icon': 'ico',
	'image/vnd.microsoft.icon': 'ico',
	'video/quicktime': 'mov',
	'video/x-msvideo': 'avi',
	'video/mpeg': 'mpg',
	'audio/mpeg': 'mp3',
	'audio/x-wav': 'wav',
	'audio/wave': 'wav',
	'audio/x-m4a': 'm4a',
	'audio/mp4': 'm4a',
	'text/plain': 'txt',
	'text/markdown': 'md',
	'application/msword': 'doc',
	'application/vnd.ms-excel': 'xls',
	'application/vnd.ms-powerpoint': 'ppt',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
};

// data: 地址按媒体类型推导扩展名（小写）；推导不出时为空串
const getDataExtension = (mime: string) => {
	const ext = DATA_EXTENSIONS[mime] || mime.split('/')[1] || '';
	return /^[a-z0-9]{1,8}$/.test(ext) ? ext : '';
};

/**
 * 通过文件url判断文件类型（内置规则）
 * @param v 文件url或者文件名
 * @returns ~
 */
export const getFileType = (v: string): FilePreviewFileType => {
	// data: 地址没有扩展名，按媒体类型的主类型识别
	const data = parseDataUrl(v);
	if (data) {
		const kind = data.mime.split('/')[0];
		return isFileType(kind) ? kind : 'file';
	}
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
	const type = typeof fn === 'function' ? fn({ source: v }) : null;
	return isFileType(type) ? type : getFileType(v);
};

/**
 * 通过文件url获取文件名（内置规则）：取最后一段，去掉query与hash并解码；data: 地址取 name 参数，没有时为 file.<扩展名>
 * @param v 文件url
 * @returns ~
 */
export const getFileName = (v: string) => {
	const data = parseDataUrl(v);
	if (data) {
		const param = data.type.split(';').find(item => /^name=/i.test(item));
		if (param) {
			try {
				return decodeURIComponent(param.slice(5));
			} catch {
				return param.slice(5);
			}
		}
		const ext = getDataExtension(data.mime);
		return ext ? `file.${ext}` : 'file';
	}
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
	const name = typeof fn === 'function' ? fn({ source: v }) : null;
	return typeof name === 'string' && name ? name : getFileName(v);
};

/**
 * 按协议白名单放行地址（相对地址按当前页面解析），返回解析后的地址；不在白名单或无法解析时为undefined
 * @param source ~
 * @param protocols 如 ['http:', 'https:']
 * @returns ~
 */
export const allowedUrl = (source: string, protocols: string[]) => {
	if (!source) return;
	try {
		const url = new URL(source, window.location.href);
		return protocols.includes(url.protocol) ? url.href : undefined;
	} catch {
		return;
	}
};

export const getFileExtension = (v: string) => {
	const data = parseDataUrl(v);
	if (data) return getDataExtension(data.mime).toUpperCase();
	const match = stripQuery(v).match(/\.([a-z0-9]{1,8})$/i);
	return match ? match[1].toUpperCase() : '';
};

// 越界、非整数时回退到第一项
export const resolveCurrent = (data: unknown[], current = 0) => (data[current] ? current : 0);

/**
 * 打开时的起点：传入的 triggerElement，其次打开项自己的 element，再其次最近一次点击的位置（传 null 时不用点击）
 * @param trigger 传入的 triggerElement
 * @param element 打开项自己的 element
 * @returns 起点；没有时为 null
 */
export const resolveTrigger = (trigger: Element | VirtualElement | null | undefined, element?: Element | null) => {
	return trigger || element || (trigger === undefined ? VirtualElement.fromClick() : null);
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
