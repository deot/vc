const endsWith = (str: string, suffix: string) => {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * file.type 在某些windows下为空
 * @param file ~
 * @param accept ~
 * @returns boolean ~
 */
export const attrAccept = (file: File, accept?: string) => {
	if (file
		&& file instanceof Blob
		&& file.type
		&& accept
	) {
		const acceptArr = Array.isArray(accept) ? accept : accept.split(',');
		const filename = file.name || '';
		const mimeType = file.type;

		const baseMimeType = mimeType.replace(/\/.*$/, '');

		return acceptArr.some((type) => {
			const validType = type.trim();
			if (validType.charAt(0) === '.') {
				return endsWith(filename.toLowerCase(), validType.toLowerCase());
			} else if (/\/\*$/.test(validType)) {
				// This is something like a image/* mime type
				return baseMimeType === validType.replace(/\/.*$/, '');
			}
			return mimeType === validType;
		});
	}
	return true;
};
