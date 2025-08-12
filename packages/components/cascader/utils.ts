import { cloneDeep } from 'lodash-es';
import type { TreeData, TreeValue, TreeLabel } from '../select/utils';

/**
 * 获取源数据
 * [value, label, children]
 * value: Number or String -> '11' == 11
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
				const target = pre.find(it => it.value == cur) || {};
				data.push(target);
				label.push(target.label as string);
				return target.children || [];
			}, source);
		} else {
			value.forEach((item, index) => {
				if (!source[index]) return; // value的长度可能超过source
				const target = source[index].find((it: TreeData) => it.value == item);
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
