/** @jsxImportSource vue */

import { defineComponent, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { Render } from '../customer/types';
import { Scroller } from '../scroller/index';
import { Tree } from './tree';

const COMPONENT_NAME = 'vc-tree-select-content';

/**
 * 高亮 label 中命中关键词的部分
 * @param label ~
 * @param regex ~
 * @returns ~
 */
export const renderHighlight = (label: any, regex?: RegExp) => {
	const text = String(label ?? '');
	if (!regex || !regex.source || regex.source === '(?:)' || !text) return text;

	const matcher = new RegExp(regex.source, 'gi');
	const result: any[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = matcher.exec(text))) {
		if (!match[0]) {
			matcher.lastIndex++;
			continue;
		}
		match.index > lastIndex && result.push(text.slice(lastIndex, match.index));
		result.push(<span class="vc-tree-select__highlight">{match[0]}</span>);
		lastIndex = match.index + match[0].length;
	}
	lastIndex < text.length && result.push(text.slice(lastIndex));
	return result;
};

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
		renderNodeLabel: Function as Render,
		searchValue: {
			type: String,
			default: ''
		},
		searchRegex: RegExp as PropType<RegExp>,
		// 远程搜索时数据已由 loadData 过滤，本地仅高亮
		remote: {
			type: Boolean,
			default: false
		}
	},
	emits: ['change'],
	setup(props, { emit }) {
		const treeRef = ref<any>(null);

		const filterNode = (keyword: string, data: any, node: any) => {
			if (!keyword || props.remote || !props.searchRegex) return true;
			return props.searchRegex.test(String(node?.getter?.label ?? data.label ?? ''));
		};

		const renderLabel = ({ store, row }: any) => {
			const label = store?.getter?.label ?? row.label;
			return <span>{renderHighlight(label, props.searchValue.trim() ? props.searchRegex : void 0)}</span>;
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

		return () => {
			const searching = !!props.searchValue.trim();
			return (
				<Scroller class="vc-tree-select__options" max-height="200px">
					<Tree
						ref={treeRef}
						model-value={props.value}
						expanded-values={props.value}
						data={props.data}
						checkStrictly={props.checkStrictly}
						allowDispatch={false}
						showCheckbox={true}
						filterNode={filterNode}
						emptyText={searching ? '暂无匹配数据' : void 0}
						renderNodeLabel={props.renderNodeLabel || renderLabel}
						onChange={(_: any, data: any) => emit('change', _, data)}
					/>
				</Scroller>
			);
		};
	}
});
