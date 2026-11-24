import type { Slots } from 'vue';

const getInfo = (value: number | string) => {
	value = String(value);
	const length = value.length;
	const asciiLength = (value.match(/[\x20-\x7e]/g) || []).length;
	const unicodeLength = length - asciiLength;

	return {
		value,
		length,
		asciiLength,
		unicodeLength
	};
};

// 截取符合max bytes下的值
export const getFitValue = (value: number | string, maxlength: number) => {
	const it = getInfo(value);
	if ((it.asciiLength + it.unicodeLength * 2) > maxlength * 2) {
		return getFitValue(it.value.substr(0, it.length - 1), maxlength);
	}
	return value;
};

// 计算合适的maxlength大小
export const getFitMaxLength = (value: number | string, maxlength: number) => {
	const it = getInfo(value);

	return 2 * maxlength - it.unicodeLength;
};

// bytes 模式下的长度：可打印 ASCII 算半个、其他 UTF-16 码元算一个（向上取整），与 getFitValue 的限制一致
export const getBytesLength = (value: number | string) => {
	const it = getInfo(value);

	return Math.ceil(it.asciiLength / 2) + it.unicodeLength;
};

/**
 * plaintext 的内容（Input / InputNumber 两端共用）：有值时带上 prepend / append 插槽的内容，没有值时只显示 extra
 * @param value 当前值
 * @param slots 组件的插槽
 * @param extra 没有值时显示的文字
 * @returns 渲染内容
 */
export const getPlaintextChildren = (value: unknown, slots: Slots, extra: string) => {
	return String(value ?? '') !== '' ? [slots.prepend?.(), value, slots.append?.()] : extra;
};
