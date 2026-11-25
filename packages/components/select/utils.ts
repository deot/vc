import { escapeRegExp } from 'lodash-es';
import { VcInstance } from '../vc/index';

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
 * 搜索关键词的分隔符：and 分开的词都要命中，or 分开的组命中任一即可
 * 	- 先按 or 拆组，再在组内按 and 拆词；同一个分隔符两边都写时按 or 处理
 * 	- 只由空白组成的分隔符匹配任意一段连续空白（含全角空格、Tab），其它分隔符按字面匹配
 * 	- 两边都没有分隔符（{}）时整句作为一个词
 */
export interface SearchMatch {
	and?: string | string[];
	or?: string | string[];
}

/**
 * 默认：空格分隔的词都要命中，逗号（`,` 或中文输入法的 `，`）分隔的组任一命中
 */
export const DEFAULT_SEARCH_MATCH: Readonly<SearchMatch> = Object.freeze({ and: ' ', or: [',', '，'] });

/**
 * 读取 searchMatch 的全局配置的组件
 */
export type SearchMatchKey = 'Select' | 'TreeSelect' | 'Cascader' | 'AutoComplete';

/**
 * 生效的 searchMatch：组件上的值 → 全局 VcInstance.options[key].searchMatch → 默认；整个对象替换，不按键合并
 * @param value 组件上的 searchMatch
 * @param key 读取哪个组件的全局配置（移动端读同名键）；不传时不读全局配置（如 Mention）
 * @returns ~
 */
export const getSearchMatch = (value: SearchMatch | undefined, key?: SearchMatchKey): SearchMatch => {
	return value ?? (key && VcInstance.options[key]?.searchMatch) ?? DEFAULT_SEARCH_MATCH;
};

// 分隔符统一为数组，去掉空的
const toSeparators = (value?: string | string[]) => {
	return (Array.isArray(value) ? value : [value]).filter(i => typeof i === 'string' && i.length) as string[];
};

/**
 * SearchMatch 的 and / or 统一为数组（去掉空的分隔符），便于比较内容是否变化
 * @param match ~
 * @returns ~
 */
export const normalizeSearchMatch = (match: SearchMatch) => {
	return { and: toSeparators(match.and), or: toSeparators(match.or) };
};

// 分隔符 -> 拆分用的正则；没有分隔符时为 undefined（不拆）
const toSplitter = (value?: string | string[]) => {
	const separators = toSeparators(value);
	if (!separators.length) return;
	const sources = new Set(separators.map(i => (/^\s+$/.test(i) ? '\\s+' : escapeRegExp(i))));
	// 较长的在前，避免被它的前缀抢先匹配
	return new RegExp([...sources].sort((a, b) => b.length - a.length).join('|'));
};

/**
 * 搜索关键词 -> 正则
 * 	- 默认空格分隔的词需同时命中，逗号分隔的各组任一命中即可（如 `a b,c`：同时含 a 和 b，或含 c），见 SearchMatch
 * 	- 关键词为空时匹配全部
 * @param keyword ~
 * @param match 分隔符，默认 DEFAULT_SEARCH_MATCH
 * @returns ~
 */
export const createSearchRegex = (keyword: string, match: SearchMatch = DEFAULT_SEARCH_MATCH): SearchRegex => {
	const or = toSplitter(match.or);
	const and = toSplitter(match.and);
	const groups = (or ? keyword.split(or) : [keyword])
		.map(group => (and ? group.split(and) : [group]).map(word => word.trim()).filter(Boolean).map(escapeRegExp))
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
	// 可作为结果的节点，默认全部
	selectable?: (item: TreeData) => boolean;
}

/**
 * 树形搜索按整条路径匹配时，各级文字之间的连接符
 */
export const SEARCH_PATH_SEPARATOR = ' / ';

/**
 * 按整条路径（各级文字用 SEARCH_PATH_SEPARATOR 连接）匹配：多个关键词可以分别落在不同的层级上
 * 	- 须先序调用（父节点先于子节点），每个节点只拼接自己这一级，整体 O(N)
 * 	- 搜索正则对追加的文字是单调的：祖先命中时子孙一定命中，不再拼接与匹配
 * @param regex 见 createSearchRegex
 * @returns (node, parent, label) => 是否命中；parent 为根节点时传 undefined
 */
export const createPathMatcher = <T>(regex: RegExp) => {
	const entries = new Map<T, { text: string; hit: boolean }>();
	return (node: T, parent: T | undefined, label: string) => {
		const owner = parent === undefined ? void 0 : entries.get(parent);
		if (owner?.hit) {
			entries.set(node, owner);
			return true;
		}
		const text = owner ? `${owner.text}${SEARCH_PATH_SEPARATOR}${label}` : label;
		const entry = { text, hit: regex.test(text) };
		entries.set(node, entry);
		return entry.hit;
	};
};

const getPathText = (item: TreeData) => String(item.label ?? '');

/**
 * 树形数据中命中搜索的节点（按整条路径匹配，见 createPathMatcher），按深度优先的顺序列出它们的路径
 * @param data 树形数据
 * @param options ~
 * @returns ~
 */
export const getMatchedPaths = (data: TreeData[], options: MatchedPathsOptions = {}) => {
	const { regex, selectable } = options;
	const match = !options.remote && regex ? createPathMatcher<TreeData>(regex) : void 0;
	const result: SelectPath[] = [];
	walkTree(data, (item, ancestors) => {
		// 不可选的节点也要参与匹配：子孙的路径从它接着拼
		if (match && !match(item, ancestors[ancestors.length - 2], getPathText(item))) return;
		if (selectable && !selectable(item)) return;
		result.push({ item, labels: ancestors.map(getPathText), values: ancestors.map(i => i.value) });
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
	// 分组标题：过滤后的子项数，其后的这些行属于它
	size?: number;
	// 选项：在选项中（不含分组标题）的位置
	index?: number;
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
	let index = 0;
	(data || []).forEach((item) => {
		if (!Array.isArray(item.children) || !item.children.length) {
			match(item) && result.push({ item, index: index++ });
			return;
		}
		const children = item.children.filter(match);
		children.length && result.push({ item, group: true, size: children.length }, ...children.map(child => ({ item: child, index: index++ })));
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

type ModelValue = string | number | boolean | (number | string | boolean | any)[] | undefined;
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

type CurrentValue = (number | string | boolean)[];
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
