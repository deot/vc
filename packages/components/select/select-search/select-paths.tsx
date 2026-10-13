/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import type { PropType } from 'vue';
import { Scroller } from '../../scroller/index';
import { walkTree } from '../utils';
import type { TreeData, TreeValue, SearchRegex } from '../utils';
import { useNavigate } from '../hooks/use-navigate';
import { renderHighlight } from './highlight';

const COMPONENT_NAME = 'vc-select-paths';

export interface SelectPath {
	item: TreeData;
	labels: string[];
	values: TreeValue[];
}

const getText = (item: TreeData) => String(item.label ?? '');

/**
 * TreeSelect（级联模式）/ Cascader 的搜索结果：扁平列出命中的节点及其完整路径
 */
export const SelectPaths = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array as PropType<TreeData[]>,
			default: () => ([])
		},
		regex: RegExp as PropType<SearchRegex>,
		// 远程搜索时数据已由调用方过滤，本地只高亮
		remote: Boolean,
		// 按整条路径（各级文字用 " / " 连接）匹配并高亮；否则只看节点自身的 label
		path: Boolean,
		// 可作为结果的节点，默认全部
		selectable: Function as PropType<(item: TreeData) => boolean>,
		// 是否已选中
		checked: Function as PropType<(data: SelectPath) => boolean>,
		width: Number,
		emptyText: String
	},
	emits: ['select'],
	setup(props, { emit, slots, expose }) {
		const results = computed(() => {
			const { regex, path, selectable } = props;
			const isLocal = !props.remote && !!regex;
			const result: SelectPath[] = [];
			walkTree(props.data, (item, ancestors) => {
				if (selectable && !selectable(item)) return;
				// 只看自身文字时先匹配，未命中的节点不必整理路径
				if (isLocal && !path && !regex.test(getText(item))) return;
				const labels = ancestors.map(getText);
				// path：各级文字连起来匹配，多个关键词可以分别落在不同的层级上
				if (isLocal && path && !regex.test(labels.join(' / '))) return;
				result.push({ item, labels, values: ancestors.map(i => i.value) });
			});
			return result;
		});

		const style = computed(() => {
			return props.width ? { width: `${props.width}px` } : void 0;
		});

		// 结果变化后默认高亮第一项，回车即可选中
		const navigate = useNavigate({ selector: '.vc-select-paths__item:not(.is-disabled)', source: results });

		const handleSelect = (data: SelectPath) => {
			!data.item.disabled && emit('select', data);
		};

		expose({
			move: navigate.move,
			enter: navigate.enter
		});

		const renderItem = (data: SelectPath) => {
			const { item, labels, values } = data;
			const last = labels.length - 1;
			return (
				<div
					key={values.join(',')}
					class={[{ 'is-checked': props.checked?.(data), 'is-disabled': !!item.disabled }, 'vc-select-paths__item']}
					onClick={() => handleSelect(data)}
				>
					{ slots.prefix?.(data) }
					<span class="vc-select-paths__label" title={labels.join(' / ')}>
						{
							labels.map((label, index) => [
								props.path || index === last ? renderHighlight(label, props.regex) : label,
								index !== last ? ' / ' : null
							])
						}
					</span>
				</div>
			);
		};

		return () => {
			return (
				<Scroller
					ref={navigate.setRoot}
					class="vc-select-paths"
					style={style.value}
					max-height="200px"
					// @ts-ignore
					onMouseover={navigate.handleMouseover}
				>
					{
						results.value.length
							? results.value.map(renderItem)
							: (<div class="vc-select-paths__empty">{ props.emptyText }</div>)
					}
				</Scroller>
			);
		};
	}
});
