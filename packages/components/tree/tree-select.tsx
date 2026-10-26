/** @jsxImportSource vue */

import { defineComponent, ref, computed, nextTick } from 'vue';
import { getUid } from '@deot/helper-utils';
import { walkTree, getTreeDepth } from '../select/utils';
import type { TreeData } from '../select/utils';
import { Popover } from '../popover/index';
import { SelectTrigger } from '../select/select-trigger';
import { SelectSearch } from '../select/select-search';
import { useSelect, useSelectValue, useSelectedCache } from '../select/hooks/use-select';
import { useColumnDirection } from '../cascader/hooks/use-column-direction';
import { useLocale } from '../locale';
import { TreeSelectContent } from './tree-select-content';
import { TreeSelectContentCascader } from './tree-select-content-cascader';
import { props as treeSelectProps } from './tree-select-props';

const COMPONENT_NAME = 'vc-tree-select';

// 树：由 Popover 内置的 Scroller 限高滚动
const scrollerOptions = { maxHeight: 200 };

interface TreeNode {
	item: TreeData;
	parent?: TreeNode;
}

interface SelectedNode {
	path: (string | number)[];
	// 路径上各级的文字
	labels: string[];
}

interface DisplayTag {
	value: string | number;
	label: string;
	path?: (string | number)[];
}

export const TreeSelect = defineComponent({
	name: COMPONENT_NAME,
	props: treeSelectProps,
	emits: ['ready', 'close', 'visible-change', 'clear', 'change', 'update:modelValue'],
	setup(props, { expose }) {
		const { t } = useLocale();
		const treeSelectId = ref(getUid('tree-select'));

		// 弹层内容（树 / 级联列），方向键与回车交给它处理
		const content = ref<any>();
		const select = useSelect('tree-select', { navigator: () => content.value });
		// 级联列的展开方向：弹层挂载时判断
		const direction = useColumnDirection({
			getDirection: () => (props.cascader ? props.expandDirection : 'right'),
			getPlacement: () => props.placement,
			getColumn: () => content.value?.$el?.querySelector?.('.vc-cascader-column'),
			getDepth: () => getTreeDepth(props.data as TreeData[])
		});
		const { its, isActive, searchValue, searchRegex, searchMode, isRemote, close, toggle } = select;
		const { currentValue, multiple, sync: syncValue, handleClear } = useSelectValue(select);

		// 当前数据中每个值对应的节点；只记父级，路径在用到时（已选值）再沿父级取
		const nodes = computed(() => {
			const map = new Map<string | number, TreeNode>();
			walkTree(props.data as TreeData[], (item, ancestors) => {
				if (item.value == null) return false;
				map.set(item.value, { item, parent: map.get(ancestors[ancestors.length - 2]?.value) });
			});
			return map;
		});

		const getSelectedNode = (v: string | number) => {
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

		const currentValueGroups = computed(() => {
			if (props.checkStrictly) return;

			const allPaths = currentValue.value
				.map(v => selected.value.get(v)?.path)
				.filter(Boolean) as (string | number)[][];

			// 只保留不是其他已选路径前缀的路径：按值建前缀树，终点没有子节点的保留（不两两比较路径）
			type Trie = Map<string | number, Trie>;
			const root: Trie = new Map();
			const ends = allPaths.map(path => path.reduce((level, v) => {
				let next = level.get(v);
				next || level.set(v, (next = new Map()));
				return next;
			}, root));
			return allPaths.filter((_, i) => ends[i].size === 0);
		});

		const displayTags = computed<DisplayTag[]>(() => {
			if (!props.data.length && !isRemote()) {
				return [];
			}
			if (props.checkStrictly) {
				return currentValue.value.map((v: any) => {
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

		const tags = computed(() => {
			return displayTags.value.map(item => ({
				...item,
				// 值本身可能含分隔符，用 JSON 避免不同路径拼出相同的 key
				key: item.path ? JSON.stringify(item.path) : item.value
			}));
		});

		const autoWidth = computed(() => {
			return typeof props.autoWidth === 'boolean' ? props.autoWidth : !!props.cascader;
		});

		const sync = () => {
			syncValue(displayTags.value.map(item => item.label));
		};

		const handleRemove = (item: DisplayTag) => {
			if (props.checkStrictly) {
				const index = currentValue.value.findIndex(v => v === item.value);
				if (index === -1) return;
				currentValue.value = currentValue.value.filter((_, i) => i !== index);
			} else if (item.path) {
				const remaining = (currentValueGroups.value || []).filter(
					p => !(p.length === item.path!.length && p.every((v, i) => v === item.path![i]))
				);
				currentValue.value = [...new Set(remaining.flat())];
			}
			sync();
		};

		// 弹层就绪（此前为 display: none，无法测量）：判断级联列的展开方向；树形模式把高亮的节点（首个勾选的节点）滚动到可视范围
		const handleReady = () => {
			direction.update();
			!props.cascader && nextTick(() => content.value?.scrollIntoActive?.());
		};

		const handleChange = (_: any, data: any) => {
			// 远程搜索时 data 只是当前关键词的结果：不在其中的已选值不受这次勾选影响
			currentValue.value = isRemote()
				? [...currentValue.value.filter(v => !nodes.value.has(v)), ...data.checkedValues]
				: data.checkedValues;

			sync();
		};

		expose({
			treeSelectId,
			close,
			searchRegex,
			multiple,
			isActive,
			current: currentValue,
			currentValueGroups,
			// for portal
			toggle
		});

		const renderTrigger = () => {
			return (
				<SelectTrigger
					{...select.trigger.value}
					placeholder={its.value.attrs?.placeholder ?? t('vc.TreeSelect.placeholder')}
					text={displayTags.value[0]?.label || props.extra}
					tags={multiple.value ? tags.value : void 0}
					clearable={props.clearable && currentValue.value.length > 0}
					onClear={handleClear}
					onRemove={handleRemove}
				/>
			);
		};

		const renderHeader = () => {
			return (<SelectSearch {...select.search.value} />);
		};

		const renderContent = () => {
			return props.cascader
				? (
						<TreeSelectContentCascader
							ref={content}
							value={currentValue.value}
							data={props.data as TreeData[]}
							checkStrictly={props.checkStrictly}
							renderNodeLabel={props.renderNodeLabel}
							searchRegex={searchRegex.value}
							remote={isRemote()}
							inverted={direction.isInverted.value}
							virtualized={props.virtualized}
							onChange={handleChange}
						/>
					)
				: (
						<TreeSelectContent
							ref={content}
							value={currentValue.value}
							data={props.data}
							checkStrictly={props.checkStrictly}
							renderNodeLabel={props.renderNodeLabel}
							searchValue={searchValue.value}
							searchRegex={searchRegex.value}
							remote={isRemote()}
							virtualized={props.virtualized}
							onChange={handleChange}
						/>
					);
		};

		return () => {
			return (
				<Popover
					{...select.popover.value}
					placement={direction.placement.value}
					keepEdge={direction.keepEdge.value}
					autoWidth={autoWidth.value}
					// 树：由内置的 Scroller 限高滚动；级联：各列在高度上限内收缩并自行滚动
					scrollable={!props.cascader}
					scrollerOptions={scrollerOptions}
					onReady={handleReady}
				>
					{{
						default: renderTrigger,
						header: searchMode.value === 'popover' ? renderHeader : void 0,
						content: renderContent
					}}
				</Popover>
			);
		};
	}
});
