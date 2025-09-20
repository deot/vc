/**
 * 通过文件url判断文件类型  --->  image（图片） | video（视频） | file（其他文件）
 * @param url 文件url或者文件名
 * @returns ~
 */
export const recognizer = (url: string) => {
	const reg = /\.(jpe?g|png|gif|bmp|webp|image|heic|mp4|mov|avi|mpg|mpeg|rmvb)/ig;
	const result = url.match(reg);

	return result && result.length
		? /.(jpe?g|png|gif|bmp|webp|image|heic)/ig.test(result[result.length - 1]) ? 'image' : 'video'
		: 'file';
};

export const IMAGE_ACCEPTS = 'image/gif,image/jpeg,image/jpg,image/png';
export const VIDEO_ACCEPTS = 'video/*';
export const AUDIO_ACCEPTS = 'audio/*';
export const DOC_ACCEPTS = '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const EXCEL_ACCEPTS = '.csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const PPT_ACCEPTS = '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const PDF_ACCEPTS = '.pdf,application/pdf';
export const TXT_ACCEPTS = 'text/plain';
export const HTML_ACCEPTS = 'text/html';
