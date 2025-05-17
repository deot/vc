/**
 * 树形label
 */
export type TreeLabel = string;

/**
 * 树形value
 */
export type TreeValue = string | number;

/**
 * 树形数据
 */
export interface TreeData {
	[key: string]: any;
	label?: TreeLabel;
	value?: TreeValue;
	children?: TreeData[];
	hasChildren?: boolean;
}

export interface FlattenDataOptions {
	/**
	 * 扁平化后是否含自己本身
	 */
	parent?: boolean;

	/**
	 * 扁平化后是否含children
	 */
	cascader?: boolean;
}

// 正则内的特殊符号
const specialChar = ['?', '*', '$', '+', '^', '.', '\\'];
/**
 * 如果字符串内存在正则的符号，RegEx会报错，所以转义下
 * @param str ~
 * @returns ~
 */
export const escapeString = (str: string) => {
	let val = '';
	for (const char of str) {
		val += specialChar.includes(char) ? '\\' + char : char;
	}
	return val;
};

export const getLabel = (data: TreeData, v: TreeValue): TreeLabel => {
	if (typeof v === 'undefined' || v === '') return '';
	const { label = '' } = data.find((i: TreeData) => i.value == v) || {};
	return label;
};

/**
 * Table, Tree-Select 组件有多处使用
 * @param data ~
 * @param options ~
 * @returns ~ ~
 */
export const flattenData = (data: TreeData, options: FlattenDataOptions = {}): TreeData => {
	let result: TreeData = [];
	data.forEach((item: TreeData) => {
		if (item.children) {
			const { children, ...rest } = item;
			const items: TreeData = flattenData(children, options);
			result = result.concat(
				options.parent
					? [options.cascader ? item : rest].concat(items)
					: items
			);
		} else {
			result.push(item);
		}
	});
	return result;
};
