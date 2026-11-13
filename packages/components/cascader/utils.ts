import { cloneDeep } from 'lodash-es';
import { toCurrentValue, toModelValue } from '../select/utils';
import type { TreeData, TreeValue, TreeLabel } from '../select/utils';

/**
 * 获取源数据
 * [value, label, children]
 * @param value ~
 * @param source ~
 * @returns source ~
 */
export const getSelectedData = (value: TreeValue[] = [], source: TreeData[] = []) => {
	const label: TreeLabel[] = [];
	const data: TreeData[] = [];

	if (source.length !== 0) {
		if (source.some(i => !!i.children) || !(source[0] instanceof Array)) { // 联动
			value.reduce((pre, cur) => {
				const target = pre.find(it => it.value === cur) || {};
				data.push(target);
				label.push(target.label as string);
				return target.children || [];
			}, source);
		} else {
			value.forEach((item, index) => {
				if (!source[index]) return; // value的长度可能超过source
				const target = source[index].find((it: TreeData) => it.value === item);
				data.push(target);
				label.push(target.label);
			});
		}
	}

	return cloneDeep({
		value,
		label,
		data
	});
};

/**
 * 某个值所在的路径：深度优先找第一个 value 与之相等（===）的节点
 * @param data 树形数据
 * @param value 值
 * @returns 从根到该节点的各级 value；找不到时为空数组
 */
const getValuePath = (data: TreeData[] = [], value: TreeValue): TreeValue[] => {
	for (const item of data) {
		if (item.value === value) return [item.value];
		const path = item.children?.length ? getValuePath(item.children, value) : [];
		if (path.length) return [item.value, ...path];
	}
	return [];
};

// 值 -> 路径所需的属性（Cascader、MCascader 的 props 都满足，直接传入）
export interface CascaderPathOptions {
	checkStrategy: string;
	numerable: boolean;
	separator: string;
	data: TreeData[];
}

/**
 * v-model -> 路径（Cascader 与 MCascaderView 共用）
 * 	- all：值即路径
 * 	- child：值为最后一级（传数组时取最后一项，字符串不拆分），从 data 中找出路径；值在不同分支重复时，保留当前路径
 * 	- 都按 === 比较，numerable 时字符串先转为数字
 * @param v ~
 * @param options ~
 * @param current 当前路径：值在不同分支重复时保留它
 * @returns ~
 */
export const toCascaderPath = (v: any, options: CascaderPathOptions, current: TreeValue[] = []): TreeValue[] => {
	const { numerable, separator } = options;
	if (options.checkStrategy !== 'child') return toCurrentValue(v, { numerable, separator });

	const [value] = toCurrentValue((Array.isArray(v) ? v : [v]).slice(-1), { numerable, separator });
	if (typeof value === 'undefined' || value === null || value === '') return [];
	return current.length && current[current.length - 1] === value ? current : getValuePath(options.data, value);
};

export interface CascaderValueOptions {
	checkStrategy: string;
	modelValue: any;
	max: number;
	numerable: boolean;
	separator: string;
	nullValue: any;
}

/**
 * 路径 -> v-model，形状跟随当前 v-model（同 toModelValue）
 * 	- child：数组时为 [最后一级]，清空为 []；否则为最后一级，清空为 nullValue
 * @param path ~
 * @param options ~
 * @returns ~
 */
export const toCascaderValue = (path: TreeValue[], options: CascaderValueOptions) => {
	if (options.checkStrategy === 'child') {
		const value = path.slice(-1);
		return Array.isArray(options.modelValue) ? value : path.length ? value[0] : options.nullValue;
	}
	return toModelValue(path, options);
};

/**
 * 路径上的各级数据（找不到的一级为 undefined，之后不再查找）
 * @param path ~
 * @param data ~
 * @returns ~
 */
export const getPathRows = (path: TreeValue[], data: TreeData[] = []) => {
	const rows: TreeData[] = [];
	let list: TreeData[] | undefined = data;
	for (const value of path) {
		const row = list?.find(i => i.value === value);
		if (!row) break;
		rows.push(row);
		list = row.children;
	}
	return rows;
};

/**
 * v-model 对应路径的各级文字
 * @param v ~
 * @param options ~
 * @returns ~
 */
export const getPathLabels = (v: any, options: CascaderPathOptions) => {
	return getPathRows(toCascaderPath(v, options), options.data).map(row => row.label as TreeLabel);
};

/**
 * loadData 的参数：被展开的一项与从根到它的各级值、文字
 */
export interface CascaderLoadDataPayload {
	row: TreeData;
	values: TreeValue[];
	labels: TreeLabel[];
}
