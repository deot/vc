import { computed } from 'vue';
import type { Ref } from 'vue';
import { walkTree } from '../../select/utils';
import type { TreeData, TreeValue } from '../../select/utils';
import { useSelectedCache } from '../../select/hooks/use-select';
import type { TreeCheckStrategy } from '../types';

interface TreeNodeLink {
	item: TreeData;
	parent?: TreeNodeLink;
}

interface SelectedNode {
	path: TreeValue[];
	// 路径上各级的文字
	labels: string[];
}

/**
 * 显示的已选项（触发器的文字与标签、移动端的数量与文字）
 * 	- 联动时为没有被其他已选节点包含的那一层，带完整路径，文字为各级以 / 连接
 * 	- 独立勾选时为每个已选节点，文字为节点自身的
 */
export interface TreeSelectDisplayTag {
	value: TreeValue;
	label: string;
	path?: TreeValue[];
}

interface TreeSelectValueProps {
	data: unknown[];
	checkStrategy: TreeCheckStrategy;
}

interface TreeSelectValueOptions {
	// 选中的值（v-model 解析后的数组）
	currentValue: Ref<TreeValue[]>;
	// 远程搜索：data 只是当前关键词的结果，不在其中的已选值沿用上次查到的路径与文字
	isRemote?: () => boolean;
}

/**
 * TreeSelect / MTreeSelect 共用：已选值对应的路径与文字、显示的标签、移除标签、按树的勾选写回选中的值
 * @param props ~
 * @param options ~
 * @returns ~
 */
export const useTreeSelectValue = (props: TreeSelectValueProps, options: TreeSelectValueOptions) => {
	const { currentValue, isRemote = () => false } = options;

	// 当前数据中每个值对应的节点；只记父级，路径在用到时（已选值）再沿父级取
	const nodes = computed(() => {
		const map = new Map<TreeValue, TreeNodeLink>();
		walkTree(props.data as TreeData[], (item, ancestors) => {
			if (item.value == null) return false;
			map.set(item.value, { item, parent: map.get(ancestors[ancestors.length - 2]?.value) });
		});
		return map;
	});

	const getSelectedNode = (v: TreeValue) => {
		let node = nodes.value.get(v);
		if (!node) return;
		const result: SelectedNode = { path: [], labels: [] };
		for (; node; node = node.parent) {
			result.path.unshift(node.item.value);
			result.labels.unshift(node.item.label || '');
		}
		return result;
	};

	// 已选值的路径与文字；远程搜索时，不在当前结果里的沿用上次查到的
	const getSelected = useSelectedCache<SelectedNode>(isRemote);
	const selected = computed(() => {
		return getSelected(currentValue.value, getSelectedNode);
	});

	// 父子独立勾选
	const strict = computed(() => props.checkStrategy === 'strict');

	const currentValueGroups = computed(() => {
		if (strict.value) return;

		const allPaths = currentValue.value
			.map(v => selected.value.get(v)?.path)
			.filter(Boolean) as TreeValue[][];

		// 只保留不是其他已选路径前缀的路径：按值建前缀树，终点没有子节点的保留（不两两比较路径）
		type Trie = Map<TreeValue, Trie>;
		const root: Trie = new Map();
		const ends = allPaths.map(path => path.reduce((level, v) => {
			let next = level.get(v);
			next || level.set(v, (next = new Map()));
			return next;
		}, root));
		return allPaths.filter((_, i) => ends[i].size === 0);
	});

	const displayTags = computed<TreeSelectDisplayTag[]>(() => {
		if (!props.data.length && !isRemote()) {
			return [];
		}
		if (strict.value) {
			return currentValue.value.map((v) => {
				const labels = selected.value.get(v)?.labels;
				return {
					value: v,
					label: labels?.[labels.length - 1] || ''
				};
			});
		}

		return (currentValueGroups.value || []).map((path) => {
			const value = path[path.length - 1];
			const label = (selected.value.get(value)?.labels || []).filter(Boolean).join(' / ');
			return {
				path,
				value,
				label
			};
		});
	});

	// 显示的文字（随 v-model 一并发出）
	const labels = computed(() => displayTags.value.map(item => item.label));

	/**
	 * 移除一项：独立勾选时只移除这一项；联动时连同它的祖先（不再全选）与子孙，各种回填方式的值通用
	 * @param item ~
	 */
	const remove = (item: TreeSelectDisplayTag) => {
		const { value, path } = item;
		currentValue.value = currentValue.value.filter((v) => {
			if (v === value) return false;
			if (!path) return true;
			return !path.includes(v) && !selected.value.get(v)?.path.includes(value);
		});
	};

	/**
	 * 按树的勾选写回选中的值
	 * 	- 远程搜索时树只是当前关键词的结果：不在其中的已选值不受这次勾选影响
	 * @param checkedValues 树回填的值
	 */
	const apply = (checkedValues: TreeValue[]) => {
		currentValue.value = isRemote()
			? [...currentValue.value.filter(v => !nodes.value.has(v)), ...checkedValues]
			: checkedValues;
	};

	return {
		selected,
		currentValueGroups,
		displayTags,
		labels,
		remove,
		apply
	};
};
