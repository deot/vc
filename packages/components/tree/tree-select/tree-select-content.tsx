/** @jsxImportSource vue */

import { defineComponent, provide, ref, shallowRef, toRaw, watch } from 'vue';
import type { Component, PropType } from 'vue';
import { renderType } from '../../customer/customer-props';
import { useLocale } from '../../locale';
import { renderHighlight } from '../../select/select-search';
import { createPathMatcher } from '../../select/utils';
import type { SearchRegex } from '../../select/utils';
import { Tree } from '../tree';
import type { TreeNode } from '../store';
import type { TreeCheckStrategy, TreeHighlightProvide } from '../types';

const COMPONENT_NAME = 'vc-tree-select-content';

export const TreeSelectContent = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: {
			type: Array as () => Array<string | number>,
			required: true
		},
		data: {
			type: Array,
			default: () => []
		},
		checkStrategy: {
			type: String as PropType<TreeCheckStrategy>,
			default: 'all'
		},
		renderNodeLabel: renderType,
		searchValue: {
			type: String,
			default: ''
		},
		searchRegex: RegExp as PropType<SearchRegex>,
		// 远程搜索时数据已由 loadData 过滤，本地仅高亮
		remote: {
			type: Boolean,
			default: false
		},
		// 只渲染视口附近的节点，见 Tree
		virtualized: {
			type: Boolean,
			default: false
		},
		// 见 TreeSelect 的 max：为 1 时没有复选框，点节点选中
		max: {
			type: Number,
			default: 0
		},
		// 内部使用：树组件，默认桌面端的 Tree（MTreeSelect 传 MTree）
		tree: {
			type: Object as PropType<Component>,
			default: () => Tree
		},
		// 内部使用：移动端，没有键盘高亮
		mobile: {
			type: Boolean,
			default: false
		}
	},
	// select：一次有效的选择（单选时点已选中的节点也算），TreeSelect 单选时据此关闭
	emits: ['change', 'select'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const treeRef = ref<any>(null);

		// 有搜索词（只有空白、分隔符时不算），与 Select 一致
		const isSearching = () => !!props.searchRegex?.highlight;

		// 按整条路径匹配（与 Cascader、级联列一致，见 createPathMatcher）；每次过滤前重建，TreeStore.filter 先序遍历
		let match: ReturnType<typeof createPathMatcher<TreeNode>> | undefined;
		const filterNode = (_: string, data: any, node: TreeNode) => {
			if (!match) return true;
			const parent = node.parentNode && toRaw(node.parentNode.states).level > 0 ? node.parentNode : void 0;
			return match(node, parent, String(node.getter.label ?? data.label ?? ''));
		};

		// 带上行文字的类名：沿用 Tree 对文字的样式（如 MTree 的单行省略）
		const renderLabel = ({ store, row }: any) => {
			const label = store?.getter?.label ?? row.label;
			return <span class="vc-tree-node__label">{renderHighlight(label, props.searchRegex)}</span>;
		};

		// 搜索展开命中节点的祖先，清空搜索词时恢复搜索前的展开状态，见 TreeStore.filter
		// searchRegex 只在匹配内容变化时换新（见 useSearchRegex），搜索规则（searchMatch）变化同样重新过滤
		watch(
			() => [props.searchRegex, props.data] as const,
			([regex]) => {
				const searching = isSearching();
				match = searching && !props.remote && regex ? createPathMatcher<TreeNode>(regex) : void 0;
				treeRef.value?.filter(searching ? props.searchValue.trim() : '');
			},
			{ flush: 'post' }
		);

		/**
		 * 按已选值展开（已选节点及其祖先）：只在打开面板（弹层每次打开重新挂载）与数据变化时，勾选不展开节点
		 * 	- 每次勾选都按全部已选值展开时，勾选收起的父节点会展开整棵子树，列表行数跳变
		 */
		const expandedValues = shallowRef(props.value);
		watch(() => props.data, () => (expandedValues.value = props.value));

		// 键盘高亮（与 Select / Cascader 一致，见 Tree 的 navigate）：搜索词、数据变化后为第一个节点
		// 移动端没有：点按后不残留高亮的底色
		props.mobile || provide('vc-tree-highlight', { source: () => [props.searchValue, props.data] } satisfies TreeHighlightProvide);

		expose({
			move: (step: number) => treeRef.value?.move(step),
			shift: (step: number) => treeRef.value?.shift(step),
			enter: () => treeRef.value?.enter(),
			scrollIntoActive: () => treeRef.value?.scrollIntoActive(),
			scrollToNode: (value: any, options?: any) => treeRef.value?.scrollToNode(value, options)
		});

		return () => {
			const searching = isSearching();
			const single = props.max === 1;
			const TreeComponent = props.tree as typeof Tree;
			return (
				// 移动端不带桌面端的高亮样式（聚焦、悬停的底色），由 MTree 自己处理
				<div class={props.mobile ? 'vcm-tree-select-content' : 'vc-tree-select__options'}>
					<TreeComponent
						ref={treeRef}
						model-value={props.value}
						expanded-values={expandedValues.value}
						data={props.data}
						checkStrategy={props.checkStrategy}
						max={props.max}
						allowDispatch={false}
						showCheckbox={!single}
						checkOnClickNode={single}
						filterNode={filterNode}
						virtualized={props.virtualized}
						emptyText={searching ? t('vc.TreeSelect.noMatch') : void 0}
						renderNodeLabel={props.renderNodeLabel || renderLabel}
						onChange={(_: any, data: any) => emit('change', _, data)}
						onCheck={(payload: any) => emit('select', payload)}
					/>
				</div>
			);
		};
	}
});
