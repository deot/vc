/** @jsxImportSource vue */

import { defineComponent, ref, watch, onMounted } from 'vue';
import type { PropType } from 'vue';
import { renderType } from '../customer/customer-props';
import { useLocale } from '../locale';
import { renderHighlight } from '../select/select-search';
import type { SearchRegex } from '../select/utils';
import { Tree } from './tree';
import type { TreeNode } from './store';
import { useNavigate } from '../select/hooks/use-navigate';

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
		}
	},
	emits: ['change'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const treeRef = ref<any>(null);
		const getRows = (): TreeNode[] => treeRef.value?.getRows() || [];

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

		/**
		 * 键盘高亮（与 Select / Cascader 一致）：焦点留在触发器或搜索栏
		 * 	- ↑ ↓ 在可见节点间移动；← → 收起 / 展开，已收起时回到父节点、已展开时进入第一个子节点；回车切换勾选
		 * 	- 打开时高亮第一个勾选的节点（弹层就绪后滚动到它），搜索词、数据变化后为第一个节点
		 * 	- 鼠标在节点上移动时高亮跟随
		 */
		const navigate = useNavigate<TreeNode>({
			getList: getRows,
			isEnabled: node => !node.getter.disabled,
			prefer: node => node.states.checked,
			select: node => treeRef.value?.toggleCheck(node),
			source: () => [props.searchValue, props.data]
		});

		// 展开 / 收起使行增减：高亮按节点重新对上
		watch(getRows, () => navigate.sync(), { flush: 'post' });

		const shift = (step: number) => {
			const rows = getRows();
			const index = navigate.getActive();
			const node = rows[index];
			if (!node) return;
			const { isLeaf, expanded } = node.states;
			if (step > 0) {
				if (isLeaf) return;
				expanded
					? rows[index + 1]?.parentNode === node && navigate.activate(index + 1)
					: treeRef.value?.toggleNode(node);
			} else if (!isLeaf && expanded) {
				treeRef.value?.toggleNode(node);
			} else if (node.parentNode && node.parentNode.states.level > 0) {
				navigate.activate(rows.indexOf(node.parentNode));
			}
		};

		// 只在指针移到另一行时处理
		let hovered: Element | null = null;
		const handleMousemove = (e: MouseEvent) => {
			const row = (e.target as Element).closest?.('[role="treeitem"]') || null;
			if (row === hovered) return;
			hovered = row;
			const index = row ? treeRef.value?.getIndex(row) ?? -1 : -1;
			index !== -1 && navigate.hover(index);
		};

		// 挂载后再交给高亮：此时 Tree 内部的列表也已就绪（在 ref 回调里交，Tree 的列表 ref 可能还没赋值）
		onMounted(() => navigate.setList(treeRef.value));

		expose({
			move: navigate.move,
			shift,
			enter: navigate.enter,
			scrollIntoActive: navigate.scrollIntoActive
		});

		return () => {
			const searching = !!props.searchValue.trim();
			return (
				<div class="vc-tree-select__options" onMousemove={handleMousemove}>
					<Tree
						ref={treeRef}
						model-value={props.value}
						expanded-values={props.value}
						data={props.data}
						checkStrictly={props.checkStrictly}
						allowDispatch={false}
						showCheckbox={true}
						filterNode={filterNode}
						emptyText={searching ? t('vc.TreeSelect.noMatch') : void 0}
						renderNodeLabel={props.renderNodeLabel || renderLabel}
						onChange={(_: any, data: any) => emit('change', _, data)}
					/>
				</div>
			);
		};
	}
});
