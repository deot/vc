/** @jsxImportSource vue */

import { defineComponent, ref, computed, nextTick } from 'vue';
import { getUid } from '@deot/helper-utils';
import { getTreeDepth } from '../../select/utils';
import type { TreeData } from '../../select/utils';
import { Popover } from '../../popover/index';
import { SelectTrigger } from '../../select/select-trigger';
import { SelectSearch } from '../../select/select-search';
import { useSelect, useSelectValue } from '../../select/hooks/use-select';
import { useColumnDirection } from '../../cascader/hooks/use-column-direction';
import { useLocale } from '../../locale';
import { TreeSelectContent } from './tree-select-content';
import { TreeSelectContentCascader } from './tree-select-content-cascader';
import { props as treeSelectProps } from './tree-select-props';
import { useTreeSelectValue } from './use-tree-select-value';
import type { TreeSelectDisplayTag } from './use-tree-select-value';

const COMPONENT_NAME = 'vc-tree-select';

// 树：由 Popover 内置的 Scroller 限高滚动
const scrollerOptions = { maxHeight: 200 };

export const TreeSelect = defineComponent({
	name: COMPONENT_NAME,
	props: treeSelectProps,
	emits: ['ready', 'close', 'visible-change', 'clear', 'change', 'update:modelValue'],
	setup(props, context) {
		const { expose } = context;
		const { t } = useLocale();
		const treeSelectId = ref(getUid('tree-select'));

		// 弹层内容（树 / 级联列），方向键与回车交给它处理
		const content = ref<any>();
		const select = useSelect(props, context, { name: 'tree-select', navigator: () => content.value });
		// 级联列的展开方向：弹层挂载时判断
		const direction = useColumnDirection({
			getDirection: () => (props.cascader ? props.expandDirection : 'right'),
			getPlacement: () => props.placement,
			getColumn: () => content.value?.$el?.querySelector?.('.vc-cascader-column'),
			getDepth: () => getTreeDepth(props.data as TreeData[])
		});
		const { its, isActive, searchValue, searchRegex, searchMode, isRemote, close, toggle } = select;
		const { currentValue, multiple, getModelValue, sync: syncValue, handleClear } = useSelectValue(props, context, { select });

		const { currentValueGroups, displayTags, labels, remove, apply } = useTreeSelectValue(props, { currentValue, isRemote });

		// 已选项文字经 formatter 的显示内容：单选触发器的文字与 plaintext
		const formatLabel = computed(() => {
			if (!currentValue.value.length) return '';
			return props.formatter(labels.value, getModelValue());
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
			syncValue(labels.value);
		};

		// 移除标签，见 useTreeSelectValue 的 remove
		const handleRemove = (item: TreeSelectDisplayTag) => {
			remove(item);
			sync();
		};

		// 弹层就绪（此前为 display: none，无法测量）：判断级联列的展开方向；树形模式把高亮的节点（首个勾选的节点）滚动到可视范围
		const handleReady = () => {
			direction.update();
			!props.cascader && nextTick(() => content.value?.scrollIntoActive?.());
		};

		// 单选：选中一个节点后关闭（点已选中的节点也关闭），同 Select
		const handleSelect = () => {
			multiple.value || close();
		};

		const handleChange = (_: any, data: any) => {
			apply(data.checkedValues);
			sync();
			multiple.value && select.clearSearch();
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
					text={(multiple.value ? displayTags.value[0]?.label : formatLabel.value) || props.extra}
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
							checkStrategy={props.checkStrategy}
							renderNodeLabel={props.renderNodeLabel}
							searchRegex={searchRegex.value}
							remote={isRemote()}
							inverted={direction.isInverted.value}
							virtualized={props.virtualized}
							max={props.max}
							onChange={handleChange}
							onSelect={handleSelect}
						/>
					)
				: (
						<TreeSelectContent
							ref={content}
							value={currentValue.value}
							data={props.data}
							checkStrategy={props.checkStrategy}
							renderNodeLabel={props.renderNodeLabel}
							searchValue={searchValue.value}
							searchRegex={searchRegex.value}
							remote={isRemote()}
							virtualized={props.virtualized}
							max={props.max}
							onChange={handleChange}
							onSelect={handleSelect}
						/>
					);
		};

		return () => {
			if (props.plaintext) {
				return (<span class="vc-tree-select-plaintext">{ formatLabel.value || props.extra }</span>);
			}
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
