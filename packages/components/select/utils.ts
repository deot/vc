import { escapeRegExp } from 'lodash-es';

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

/**
 * 搜索用的正则：自身只用于 test；highlight 用于标出命中的部分（任一关键词，带一个捕获组），没有关键词时为空
 */
export type SearchRegex = RegExp & { highlight?: RegExp };

/**
 * 搜索关键词 -> 正则
 * 	- 空格分隔的词需同时命中，逗号分隔的各组任一命中即可（如 `a b,c`：同时含 a 和 b，或含 c）
 * 	- 关键词为空时匹配全部
 * @param keyword ~
 * @returns ~
 */
export const createSearchRegex = (keyword: string): SearchRegex => {
	const groups = keyword
		.split(',')
		.map(group => group.split(/\s+/).filter(Boolean).map(escapeRegExp))
		.filter(words => words.length);

	if (!groups.length) return new RegExp('', 'i');

	const source = groups
		.map(words => words.map(word => `(?=[\\s\\S]*${word})`).join(''))
		.join('|');
	const regex: SearchRegex = new RegExp(`^(?:${source})`, 'i');
	// 较长的词在前，避免被它的前缀抢先匹配
	const words = groups.flat().sort((a, b) => b.length - a.length);
	regex.highlight = new RegExp(`(${words.join('|')})`, 'gi');
	return regex;
};

/**
 * 深度优先遍历树形数据
 * @param data ~
 * @param fn 返回 false 时不进入该节点的子节点；ancestors 为从根到当前节点的各级数据，遍历中复用同一个数组，需要保留时自行拷贝
 * @param ancestors ~
 */
export const walkTree = (
	data: TreeData[],
	fn: (item: TreeData, ancestors: TreeData[]) => unknown,
	ancestors: TreeData[] = []
) => {
	data.forEach((item) => {
		ancestors.push(item);
		fn(item, ancestors) !== false && item.children?.length && walkTree(item.children, fn, ancestors);
		ancestors.pop();
	});
};

/**
 * 树形数据的层级（最深一条路径的节点数）
 * @param data ~
 * @returns ~
 */
export const getTreeDepth = (data: TreeData[]) => {
	let depth = 0;
	walkTree(data, (_, ancestors) => {
		depth = Math.max(depth, ancestors.length);
	});
	return depth;
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
