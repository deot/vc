const fileRegExps = {
	image: /\.(jpe?g|png|gif|bmp|webp|image|heic)$/i,
	video: /\.(mp4|mov|avi|mpg|mpeg|rmvb)$/i,
	audio: /\.(mp3|aac|wav|flac|ape|ogg|m4a)$/i
};
type FileType = keyof typeof fileRegExps | 'file';
/**
 * 通过文件url判断文件类型
 * @param v 文件url或者文件名
 * @returns ~
 */
export const getFileType = (v: string): FileType => {
	v = v?.toLowerCase() || '';
	const types = Object.keys(fileRegExps);
	for (let i = 0; i < types.length; i++) {
		const type = types[i] as any;
		if (fileRegExps[type].test(v)) {
			return type;
		}
	}
	return 'file';
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
