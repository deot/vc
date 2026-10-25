/** @jsxImportSource vue */

import { defineComponent, cloneVNode, isVNode, onMounted, ref, watch } from 'vue';
import type { PropType, VNode } from 'vue';
import { RecycleList } from '../../recycle-list/index';
import { scrollIntoScroller } from '../hooks/use-navigate';

const COMPONENT_NAME = 'vc-select-list';

export type SelectListAlign = 'start' | 'nearest';

export interface SelectListExposed {
	scrollToIndex: (index: number, align?: SelectListAlign) => void;
	highlight: (index: number) => void;
}

/**
 * Select / SelectPaths / Cascader 列 / Tree 共用的列表：每一行由默认插槽渲染为一个元素
 * 	- 默认全部渲染，行即根节点的子元素，按位置对应下标，不额外包装
 * 	- virtualized 时交给 RecycleList（fill=false：沿用所在的滚动容器，如弹层或列的 Scroller），只渲染视口附近的行；
 * 	  行的根节点补上登记用的钩子，记下各行节点对应的下标
 * 	- 高亮（data-active）直接写在行的节点上，不经过响应式状态：移动高亮不触发任何行的渲染；虚拟列表中尚未渲染的行挂载时补上
 * 	- 指针移入某行时发出 hover（下标）
 * 	- 插槽在本组件渲染时调用，依赖由本组件收集：调用方传入插槽时标记 $stable，父级重渲染时列表不必跟着重渲染（大量行时代价可观）
 */
export const SelectList = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array as PropType<unknown[]>,
			default: () => []
		},
		virtualized: Boolean,
		// 虚拟化时的预估行高（px），渲染后按实际尺寸校正
		estimateSize: Number
	},
	emits: ['hover'],
	setup(props, { slots, emit, expose }) {
		const root = ref<HTMLElement>();
		let recycleList: any;
		// 虚拟化时已渲染的行：下标 -> 节点，节点 -> 下标
		const rows = new Map<number, Element>();
		const indexes = new WeakMap<Element, number>();
		let active = -1;
		let activeEl: Element | null = null;

		const getRow = (index: number) => {
			return (props.virtualized ? rows.get(index) : root.value?.children[index]) || null;
		};

		const mark = (el: Element | null) => {
			if (el === activeEl) return;
			activeEl?.removeAttribute('data-active');
			el?.setAttribute('data-active', '');
			activeEl = el;
		};

		const highlight = (index: number) => {
			active = index;
			mark(getRow(index));
		};

		const scrollToIndex = (index: number, align: SelectListAlign = 'nearest') => {
			if (index < 0) return;
			props.virtualized
				? recycleList?.scrollToIndex(index, { align })
				: scrollIntoScroller(getRow(index), align);
		};

		// 指针所在的行：虚拟化时为登记过的行节点，否则为根节点的哪一个子元素
		const getIndex = (target: Element) => {
			let el: Element | null = target;
			if (props.virtualized) {
				while (el && el !== root.value && !indexes.has(el)) el = el.parentElement;
				return el && indexes.has(el) ? indexes.get(el)! : -1;
			}
			while (el && el.parentElement !== root.value) el = el.parentElement;
			return el ? Array.prototype.indexOf.call(root.value!.children, el) : -1;
		};

		const handleMouseover = (e: MouseEvent) => {
			const index = getIndex(e.target as Element);
			index !== -1 && emit('hover', index);
		};

		// 数据变化后行随之增减、移动：高亮按下标重新对上（虚拟化时由行的钩子处理）；
		// 挂载时同理：调用方的 ref 回调可能先于本组件的根节点就绪而设置了高亮
		const sync = () => !props.virtualized && mark(getRow(active));
		watch(() => props.data, sync, { flush: 'post' });
		onMounted(sync);

		expose({ scrollToIndex, highlight } satisfies SelectListExposed);

		const track = (index: number, el: Element) => {
			const old = indexes.get(el);
			old !== undefined && old !== index && rows.get(old) === el && rows.delete(old);
			rows.set(index, el);
			indexes.set(el, index);
			index === active ? mark(el) : el === activeEl && mark(null);
		};

		const untrack = (el: Element) => {
			const index = indexes.get(el)!;
			rows.get(index) === el && rows.delete(index);
			indexes.delete(el);
			el === activeEl && (activeEl = null);
		};

		const renderRow = (row: unknown, index: number) => {
			return slots.default?.({ row, index }).find(isVNode) || null;
		};

		// 虚拟化时行的根节点：补上登记用的钩子；下标随数据变化时（同一节点）在 updated 中重新登记
		const renderTrackedRow = (row: unknown, index: number) => {
			const vnode = renderRow(row, index);
			return vnode && cloneVNode(vnode, {
				onVnodeMounted: (v: VNode) => track(index, v.el as Element),
				onVnodeUpdated: (v: VNode) => track(index, v.el as Element),
				onVnodeBeforeUnmount: (v: VNode) => untrack(v.el as Element)
			});
		};

		return () => {
			return (
				<div ref={root} class="vc-select-list" onMouseover={handleMouseover}>
					{
						props.virtualized
							? (
									<RecycleList
										ref={(v: any) => (recycleList = v)}
										fill={false}
										disabled
										data={props.data}
										estimateSize={props.estimateSize}
									>
										{{ default: ({ row, index }: any) => renderTrackedRow(row, index) }}
									</RecycleList>
								)
							: props.data.map(renderRow)
					}
				</div>
			);
		};
	}
});
