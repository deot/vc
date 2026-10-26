/** @jsxImportSource vue */

import { defineComponent, provide, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { renderType } from '../customer/customer-props';
import { useLocale } from '../locale';
import { renderHighlight } from '../select/select-search';
import type { SearchRegex } from '../select/utils';
import { Tree } from './tree';
import type { TreeHighlightProvide } from './types';

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
		checkStrictly: {
			type: Boolean,
			default: false
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
		}
	},
	emits: ['change'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const treeRef = ref<any>(null);

		const filterNode = (keyword: string, data: any, node: any) => {
			if (!keyword || props.remote || !props.searchRegex) return true;
			return props.searchRegex.test(String(node?.getter?.label ?? data.label ?? ''));
		};

		const renderLabel = ({ store, row }: any) => {
			const label = store?.getter?.label ?? row.label;
			return <span>{renderHighlight(label, props.searchRegex)}</span>;
		};

		const eachNode = (fn: (node: any) => void) => {
			const tree = treeRef.value;
			const walk = (nodes: any[]) => nodes.forEach((node) => {
				fn(node);
				walk(node.childNodes || []);
			});
			walk(props.data.map(item => tree?.getNode(item)).filter(Boolean));
		};

		/**
		 * 搜索会展开所有命中节点，退出搜索时恢复搜索前的展开状态
		 */
		let expandedSnapshot: Set<string | number> | null = null;
		watch(
			() => [props.searchValue.trim(), props.data] as const,
			([keyword]) => {
				const tree = treeRef.value;
				if (!tree) return;
				if (keyword && !expandedSnapshot) {
					expandedSnapshot = new Set();
					eachNode(node => node.states.expanded && expandedSnapshot!.add(tree.getNodeKey(node)));
				}

				tree.filter(keyword);

				if (!keyword && expandedSnapshot) {
					const snapshot = expandedSnapshot;
					eachNode(node => node.states.expanded && !snapshot.has(tree.getNodeKey(node)) && node.collapse());
					expandedSnapshot = null;
				}
			},
			{ flush: 'post' }
		);

		// 键盘高亮（与 Select / Cascader 一致，见 Tree 的 navigate）：搜索词、数据变化后为第一个节点
		provide('vc-tree-highlight', { source: () => [props.searchValue, props.data] } satisfies TreeHighlightProvide);

		expose({
			move: (step: number) => treeRef.value?.move(step),
			shift: (step: number) => treeRef.value?.shift(step),
			enter: () => treeRef.value?.enter(),
			scrollIntoActive: () => treeRef.value?.scrollIntoActive()
		});

		return () => {
			const searching = !!props.searchValue.trim();
			return (
				<div class="vc-tree-select__options">
					<Tree
						ref={treeRef}
						model-value={props.value}
						expanded-values={props.value}
						data={props.data}
						checkStrictly={props.checkStrictly}
						allowDispatch={false}
						showCheckbox={true}
						filterNode={filterNode}
						virtualized={props.virtualized}
						emptyText={searching ? t('vc.TreeSelect.noMatch') : void 0}
						renderNodeLabel={props.renderNodeLabel || renderLabel}
						onChange={(_: any, data: any) => emit('change', _, data)}
					/>
				</div>
			);
		};
	}
});
