import type { FilePreviewItem } from '../../types';
import { getFileExtension, allowedUrl } from '../../utils';

const OFFICE_EXTENSIONS = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);

// 只在 file 类型下区分 pdf / office，不新增第四种文件类型
export const getFileViewer = (row: Pick<FilePreviewItem, 'type' | 'name' | 'source'>) => {
	if (row.type !== 'file') return;
	const ext = (getFileExtension(row.name) || getFileExtension(row.source)).toLowerCase();
	if (ext === 'pdf') return 'pdf';
	if (OFFICE_EXTENSIONS.has(ext)) return 'office';
};

// 新窗口与下载用文件本身的地址，不用 Office 在线预览包装后的地址
export const getSourceUrl = (row: Pick<FilePreviewItem, 'source'>) => {
	return allowedUrl(row.source, ['http:', 'https:', 'blob:']);
};

// pdf 允许 http(s) 与 blob；office 只允许公网 http(s)，并交给 Office 在线预览
export const getFrameSrc = (row: FilePreviewItem) => {
	const kind = getFileViewer(row);
	if (kind === 'pdf') return getSourceUrl(row);
	if (kind !== 'office') return;
	const href = allowedUrl(row.source, ['http:', 'https:']);
	if (!href) return;
	return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(href)}`;
};
