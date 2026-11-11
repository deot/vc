import type { FilePreviewItem } from '../../types';
import { getItemExtension, allowedUrl, parseDataUrl } from '../../utils';

const OFFICE_EXTENSIONS = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);

// 可以转成 blob: 地址在新窗口或 iframe 打开的 data: 类型；blob: 地址继承当前页面的源，html、svg 等打开后会以当前页面的身份运行脚本，只给下载
const OPENABLE_DATA_TYPES = new Set(['text/plain', 'application/pdf']);

// %XX 是原始字节，其余字符交给 Blob 按 UTF-8 编码；连续的 %XX 合成一段
const toBlobParts = (body: string, base64: boolean): BlobPart[] => {
	if (base64) {
		const binary = atob(decodeURIComponent(body).replace(/\s/g, ''));
		return [Uint8Array.from(binary, c => c.charCodeAt(0))];
	}
	return body.split(/((?:%[0-9a-f]{2})+)/i).map((part, index) => {
		if (index % 2 === 0) return part;
		return Uint8Array.from(part.slice(1).split('%'), v => parseInt(v, 16));
	});
};

/**
 * data: 地址不能直接在新窗口打开（浏览器拦截），转成 blob: 地址；只转换纯文本与 pdf，用完由调用方 revokeObjectURL
 * @param source ~
 * @returns ~
 */
export const createObjectUrl = (source: string) => {
	const data = parseDataUrl(source);
	if (!data || !OPENABLE_DATA_TYPES.has(data.mime)) return;
	try {
		return URL.createObjectURL(new Blob(toBlobParts(data.body, data.base64), { type: data.type }));
	} catch {
		return;
	}
};

// 只在 file 类型下区分 pdf / office，不新增第四种文件类型；data: 地址的扩展名由媒体类型推导
export const getFileViewer = (row: Pick<FilePreviewItem, 'type' | 'name' | 'source'>) => {
	if (row.type !== 'file') return;
	const ext = getItemExtension(row).toLowerCase();
	if (ext === 'pdf') return 'pdf';
	if (OFFICE_EXTENSIONS.has(ext)) return 'office';
};

// 下载用文件本身的地址，不用 Office 在线预览包装后的地址；data: 地址可以直接下载
export const getDownloadUrl = (row: Pick<FilePreviewItem, 'source'>) => {
	return allowedUrl(row.source, ['http:', 'https:', 'blob:', 'data:']);
};

// 新窗口与 iframe 用的文件地址；data: 地址换成 createObjectUrl 转成的 blob: 地址，不能转换时为undefined
export const getFileUrl = (row: Pick<FilePreviewItem, 'source'>, objectUrl?: string) => {
	if (parseDataUrl(row.source)) return objectUrl;
	return allowedUrl(row.source, ['http:', 'https:', 'blob:']);
};

// pdf 允许 http(s) 与 blob（含 data: 转成的 blob）；office 只允许公网 http(s)，并交给 Office 在线预览
export const getFrameSrc = (row: FilePreviewItem, fileUrl = getFileUrl(row)) => {
	const kind = getFileViewer(row);
	if (kind === 'pdf') return fileUrl;
	if (kind !== 'office') return;
	const href = allowedUrl(row.source, ['http:', 'https:']);
	if (!href) return;
	return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(href)}`;
};
