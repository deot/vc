const ASCIIRegex = /[\x20-\x7e]/g;

// 只有在bytes下,会需要重新计算maxlength
export const isPassByMaxlength = (value: number | string | any[], maxlength?: number) => {
	if (typeof maxlength === 'undefined' || Array.isArray(value)) return true;
	value = String(value);
	let charLength = (value.match(ASCIIRegex) || []).length;
	let chineseLength = value.length - charLength;
	if ((charLength + chineseLength * 2) > maxlength * 2) {
		return false;
	}
	return true;
};

// 单字节换成双字节 maxlength 需要额外加的长度
export const getBytesLength = (value: number | string | any[]) => {
	if (Array.isArray(value)) return 0;
	let charArr = String(value).match(ASCIIRegex) || [];
	let charLength = charArr.length;
	if (charLength % 2 === 0) {
		return charLength /= 2;
	} else {
		return (charLength + 1) / 2;
	}
};