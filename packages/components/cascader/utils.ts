import { cloneDeep } from 'lodash-es';
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
export const getValuePath = (data: TreeData[] = [], value: TreeValue): TreeValue[] => {
	for (const item of data) {
		if (item.value === value) return [item.value];
		const path = item.children?.length ? getValuePath(item.children, value) : [];
		if (path.length) return [item.value, ...path];
	}
	return [];
};
