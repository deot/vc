/**
 * 树形label
 */
export type TreeLabel = string;

/**
 * 树形value
 */
export type TreeValue = string | number | any;

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
const specialChar = ['?', '*', '$', '+', '^', '.', '\\', '(', ')', '[', ']', '{', '}', '|'];
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

/**
 * 搜索关键词 -> 正则；空格或逗号分隔多个词，任一命中即可
 * @param keyword ~
 * @returns ~
 */
export const createSearchRegex = (keyword: string) => {
	const words = keyword
		.trim()
		.split(/[\s,]+/)
		.filter(Boolean)
		.map(escapeString);

	return new RegExp(words.join('|'), 'i');
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

type ModelValue = string | number | (number | string | any)[] | undefined;
interface ModelValueOptions {
	[key: string]: any;
	numerable: boolean;
	separator: string;
};
/**
 * 将输入数据为[]或以,分割的数据统一为[]形势
 * @param v ~
 * @param options ~
 * @returns ~ ~
 */
export const toCurrentValue = (v: ModelValue, options: ModelValueOptions) => {
	if (typeof v === 'string') {
		v = v.split(options.separator).filter(i => !!i);
		options.numerable && (v = v.map(i => +i));
	}

	v = Array.isArray(v)
		? v
		: typeof v !== 'undefined' && v !== null
			? [v]
			: []
	;

	return v;
};

type CurrentValue = (number | string)[];
interface CurrentValueOptions {
	[key: string]: any;
	numerable: boolean;
	separator: string;
	modelValue: ModelValue;
	max: number;
	nullValue: any;
};
/**
 * 根据原始输入将[]输出为[]或以,分割的形式
 * @param v ~
 * @param options ~
 * @returns ~ ~
 */
export const toModelValue = (v: CurrentValue, options: CurrentValueOptions): ModelValue => {
	let value: ModelValue;
	if (!Array.isArray(options.modelValue)) {
		value = options.max > 1 ? v.join(options.separator) : v[0];
		// 输入如果是字符串的话，那么输出应该保持一致为字符串
		if (typeof options.modelValue === 'string' && options.numerable) {
			value = `${v}`;
		}

		if (typeof v === 'undefined') {
			value = options.nullValue;
		}
	} else {
		value = v;
	}

	return value;
};

export interface FitTagsOptions {
	/**
	 * 候选 tag 的外宽（含左右 margin），长度即候选数量
	 */
	widths: number[];

	/**
	 * 容器可用宽度
	 */
	width: number;

	/**
	 * 最多行数
	 */
	lines: number;

	/**
	 * 折叠 tag（+N...）的外宽
	 */
	plusWidth: number;

	/**
	 * tag 总数
	 */
	total: number;
}

export interface FitTagsResult {
	/**
	 * 可显示的 tag 数量
	 */
	count: number;

	/**
	 * 最后一个可显示 tag 需收缩到的外宽（为折叠 tag 让位）
	 */
	shrink?: number;
}

/**
 * 按行贪心放置 tag，计算在给定行数内可显示的数量
 * 	- 需要折叠 tag 时为其让位：减少数量，最后一行只剩一个时收缩它（出现省略号）；
 * 	- 收缩后比折叠 tag 还窄（约只剩一个字）时不再显示它，只保留折叠 tag。
 * @param options ~
 * @returns ~
 */
export const fitTags = (options: FitTagsOptions): FitTagsResult => {
	const { widths, width, lines, plusWidth, total } = options;
	if (!widths.length || width <= 0 || lines <= 0) return { count: widths.length };

	// 每个 tag 放置后的所在行、行内已用宽度、是否为该行首个
	const layout: Array<{ row: number; used: number; head: boolean }> = [];
	let row = 1;
	let used = 0;
	for (let i = 0; i < widths.length; i++) {
		// 超长 tag 独占一行，由省略号截断
		const w = Math.min(widths[i], width);
		if (used > 0 && used + w > width) {
			row++;
			used = 0;
		}
		if (row > lines) break;
		layout.push({ row, used: used + w, head: used === 0 });
		used += w;
	}

	if (layout.length >= total) return { count: layout.length };

	// 需要折叠 tag：能跟在最后一个 tag 后面，或还能换到下一行
	for (let i = layout.length - 1; i >= 0; i--) {
		const item = layout[i];
		if (item.used + plusWidth <= width || (item.row < lines && plusWidth <= width)) {
			return { count: i + 1 };
		}
		if (item.head) {
			const shrink = width - plusWidth;
			return shrink >= plusWidth ? { count: i + 1, shrink } : { count: i };
		}
	}

	// layout[0].head 恒为 true，不会走到这里
	return { count: 0 };
};
