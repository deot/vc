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
 * 搜索结果中的一条：命中的节点及从根到它的各级文字与值
 */
export interface SelectPath {
	item: TreeData;
	labels: string[];
	values: TreeValue[];
}

export interface MatchedPathsOptions {
	regex?: SearchRegex;
	// 远程搜索时数据已由调用方过滤，本地不再匹配
	remote?: boolean;
	// 按整条路径（各级文字用 " / " 连接）匹配；否则只看节点自身的 label
	path?: boolean;
	// 可作为结果的节点，默认全部
	selectable?: (item: TreeData) => boolean;
}

const getPathText = (item: TreeData) => String(item.label ?? '');

/**
 * 树形数据中命中搜索的节点，按深度优先的顺序列出它们的路径
 * @param data 树形数据
 * @param options ~
 * @returns ~
 */
export const getMatchedPaths = (data: TreeData[], options: MatchedPathsOptions = {}) => {
	const { regex, path, selectable } = options;
	const isLocal = !options.remote && !!regex;
	const result: SelectPath[] = [];
	walkTree(data, (item, ancestors) => {
		if (selectable && !selectable(item)) return;
		// 只看自身文字时先匹配，未命中的节点不必整理路径
		if (isLocal && !path && !regex.test(getPathText(item))) return;
		const labels = ancestors.map(getPathText);
		// path：各级文字连起来匹配，多个关键词可以分别落在不同的层级上
		if (isLocal && path && !regex.test(labels.join(' / '))) return;
		result.push({ item, labels, values: ancestors.map(i => i.value) });
	});
	return result;
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

/**
 * 选项（或分组标题）显示与搜索用的文字：label，没有时为 value；过滤（Select）与高亮（Option）共用，两者才能对上
 * @param item 选项
 * @param item.label ~
 * @param item.value ~
 * @returns 文字
 */
export const getOptionText = (item: { label?: any; value?: any }) => String(item.label || item.value).trim();

/**
 * 一列中值为 value 的项的下标
 * @param list 一列的数据
 * @param value 值
 * @returns 下标；没有时为 -1
 */
export const findIndexByValue = (list: TreeData[] | undefined, value: TreeValue) => {
	return list ? list.findIndex(item => item.value === value) : -1;
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

/**
 * 列表的一行：分组标题或选项
 */
export interface SelectRow {
	item: TreeData;
	group?: boolean;
}

/**
 * Select / MSelectView 的列表行：分组标题与选项铺平，按搜索词过滤（filterable 为 false 的选项不参与）；没有命中项的分组不显示
 * @param data 选项，带 children 的为分组
 * @param regex 搜索词的正则，见 createSearchRegex
 * @returns ~
 */
export const getSelectRows = (data: TreeData[] | undefined, regex: RegExp): SelectRow[] => {
	const match = (item: TreeData) => item.filterable === false || regex.test(getOptionText(item));
	const result: SelectRow[] = [];
	(data || []).forEach((item) => {
		if (!Array.isArray(item.children) || !item.children.length) {
			match(item) && result.push({ item });
			return;
		}
		const children = item.children.filter(match);
		children.length && result.push({ item, group: true }, ...children.map(child => ({ item: child })));
	});
	return result;
};

/**
 * 是否多选：max 为 1 时单选，0（不限）或大于 1 时多选
 * @param max ~
 * @returns ~
 */
export const isMultiple = (max: number) => max !== 1;

/**
 * 是否已选满：多选且 max 大于 0 时，已选数量达到 max
 * @param max ~
 * @param count 已选数量
 * @returns ~
 */
export const isMaxReached = (max: number, count: number) => isMultiple(max) && max > 0 && count >= max;

/**
 * 选中的值对应的文字
 * @param values 选中的值
 * @param source 铺平的选项（见 flattenData）
 * @returns ~
 */
export const getSelectLabels = (values: TreeValue[], source: TreeData) => {
	return values.map(v => getLabel(source, v));
};

type ModelValue = string | number | (number | string | any)[] | undefined;
interface ModelValueOptions {
	[key: string]: any;
	numerable: boolean;
	separator: string;
};
/**
 * 将输入数据为[]或以,分割的数据统一为[]形势；numerable 时各项中的字符串转为数字（空串除外）
 * @param v ~
 * @param options ~
 * @returns ~ ~
 */
export const toCurrentValue = (v: ModelValue, options: ModelValueOptions) => {
	if (typeof v === 'string') {
		v = v.split(options.separator).filter(i => !!i);
	}

	v = Array.isArray(v)
		? v
		: typeof v !== 'undefined' && v !== null
			? [v]
			: []
	;

	return options.numerable
		? v.map(i => (typeof i === 'string' && i !== '' ? +i : i))
		: v;
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
 * 选中的值 -> v-model，形状跟随当前 v-model
 * 	- 数组：原样输出，清空为 []
 * 	- 其它：清空时为 nullValue（设置了的话）；多选按 separator 连接；单选为该值，字符串输入且 numerable 时输出也为字符串
 * @param v ~
 * @param options ~
 * @returns ~
 */
export const toModelValue = (v: CurrentValue, options: CurrentValueOptions): ModelValue => {
	if (Array.isArray(options.modelValue)) return v;
	if (!v.length && typeof options.nullValue !== 'undefined') return options.nullValue;
	if (isMultiple(options.max)) return v.join(options.separator);
	return typeof options.modelValue === 'string' && options.numerable ? `${v[0] ?? ''}` : v[0];
};
