import { camelize } from 'vue';
import type { VNode, Slot } from 'vue';
import { getPropByPath } from '@deot/helper-utils';
import { getChildren } from '../fragment/utils';
import { isEmpty as isEmptyValue } from '../customer/utils';
import { DescriptionsItem } from './descriptions-item';
import { DescriptionsGroup } from './descriptions-group';
import type { CustomerValue } from '../customer/types';
import type { DescriptionsOption, DescriptionsGroupOption, DescriptionsItemOption } from './types';

export interface DescriptionsItemSlots {
	default?: Slot;
	label?: Slot;
}

export interface DescriptionsParsedItem {
	row: DescriptionsItemOption;
	slots: DescriptionsItemSlots;
}

export interface DescriptionsParsedGroup {
	label?: CustomerValue;
	class?: any;
	style?: any;
	slots: { label?: Slot };
	items: DescriptionsParsedItem[];
}

const isGroupOption = (v: DescriptionsOption): v is DescriptionsGroupOption => Array.isArray(v?.children);

const flatten = (vnodes?: VNode[]) => getChildren(vnodes, [DescriptionsItem, DescriptionsGroup]);

/**
 * vnode上的props：模板中的kebab-case转为camelCase，布尔属性的空字符串视为true
 * @param vnode ~
 * @returns ~
 */
const getProps = (vnode: VNode) => {
	const result: Record<string, any> = {};
	Object.entries(vnode.props || {}).forEach(([key, value]) => {
		result[camelize(key)] = value;
	});
	result.hidden === '' && (result.hidden = true);
	return result;
};

const getSlots = (vnode: VNode): Record<string, Slot | undefined> => {
	const { children } = vnode;
	if (!children) return {};
	if (typeof children === 'object' && !Array.isArray(children)) return children as Record<string, Slot>;
	return { default: () => children as any };
};

const toItem = (vnode: VNode): DescriptionsParsedItem => {
	const slots = getSlots(vnode);
	return {
		row: getProps(vnode),
		slots: { default: slots.default, label: slots.label } as DescriptionsItemSlots
	};
};

/**
 * options与子组件统一为分组：连续的项（不在分组内）合成一个没有标题的分组
 * @param options ~
 * @param vnodes ~
 * @returns ~
 */
export const parse = (options: DescriptionsOption[] = [], vnodes: VNode[] = []) => {
	const groups: DescriptionsParsedGroup[] = [];
	let loose: DescriptionsParsedGroup | null = null;
	const push = (item: DescriptionsParsedItem) => {
		if (!loose) {
			loose = { slots: {}, items: [] };
			groups.push(loose);
		}
		loose.items.push(item);
	};

	options.forEach((option) => {
		if (!option) return;
		if (isGroupOption(option)) {
			loose = null;
			const { children, ...rest } = option;
			groups.push({ ...rest, slots: {}, items: children.filter(Boolean).map(row => ({ row, slots: {} })) });
		} else {
			push({ row: option as DescriptionsItemOption, slots: {} });
		}
	});

	flatten(vnodes).forEach((vnode) => {
		if (vnode.type === DescriptionsGroup) {
			loose = null;
			const slots = getSlots(vnode);
			const items = flatten(slots.default?.()).filter(child => child.type === DescriptionsItem).map(toItem);
			groups.push({ ...getProps(vnode), slots: { label: slots.label }, items });
		} else {
			push(toItem(vnode));
		}
	});

	return groups;
};

/**
 * 按prop路径取值；路径不存在时为undefined
 * @param data ~
 * @param prop ~
 * @returns ~
 */
export const getValue = (data: Record<string, any>, prop?: string) => {
	if (!prop) return;
	try {
		return getPropByPath(data || {}, prop).v;
	} catch {
		return;
	}
};

// 空数组也算空，0不算
export const isEmpty = (value: unknown) => isEmptyValue(value) || (Array.isArray(value) && !value.length);
