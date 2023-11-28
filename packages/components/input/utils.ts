const getInfo = (value: number | string) => {
	value = String(value);
	let length = value.length;
	let asciiLength = (value.match(/[\x20-\x7e]/g) || []).length;
	let unicodeLength = length - asciiLength;

	return {
		value,
		length,
		asciiLength,
		unicodeLength
	};
};

// 截取符合max bytes下的值
export const getFitValue = (value: number | string, maxlength: number) => {
	let it = getInfo(value);
	if ((it.asciiLength + it.unicodeLength * 2) > maxlength * 2) {
		return getFitValue(it.value.substr(0, it.length - 1), maxlength);
	}
	return value;
};

// 计算合适的maxlength大小
export const getFitMaxLength = (value: number | string, maxlength: number) => {
	let it = getInfo(value);

	return 2 * maxlength - it.unicodeLength;
};

// 计算bytes大小
export const getBytesSize = (value: number | string) => {
	let it = getInfo(value);

	return Math.ceil(it.asciiLength / 2) - it.unicodeLength;
};