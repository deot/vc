/** @jsxImportSource vue */

import { defineComponent, cloneVNode, isVNode, onMounted, ref, watch } from 'vue';
import type { PropType, VNode } from 'vue';
import { RecycleList } from '../../recycle-list/index';
import { isScrollOf, useScrollIdle } from '../../scroller/scroll-idle';
import { scrollIntoScroller } from './scroll';

const COMPONENT_NAME = 'vc-select-list';
// 虚拟化时的初始预估行高（px）；行渲染出来后改用实际高度，见 handleRowResize
const ESTIMATE_SIZE = 30;

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
 * 	- 虚拟化时行高按渲染出来的行估计：各行等高（默认渲染）时，滚动条长度与定位从一开始就准确
 * 	- 高亮（data-active）直接写在行的节点上，不经过响应式状态：移动高亮不触发任何行的渲染；虚拟列表中尚未渲染的行挂载时补上
 * 	- 指针在某行上移动时发出 hover（下标）；不用 mouseover：键盘移动使列表在静止的指针下滚动时，浏览器会补发它，高亮会被拉回指针下的一行
 * 	- 滚动期间根节点带 is-scrolling：各行的 :hover 样式据此暂停，行从静止的指针下经过时不逐行闪；停下 SCROLL_IDLE 后移除，
 * 	  浏览器按指针位置恢复 :hover。类名直接写在节点上，不触发渲染
 * 	- 插槽在本组件渲染时调用，依赖由本组件收集：调用方传入插槽时标记 $stable，父级重渲染时列表不必跟着重渲染（大量行时代价可观）
 */
export const SelectList = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array as PropType<unknown[]>,
			default: () => []
		},
		virtualized: Boolean
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
		// 渲染出来的行的实际高度，代替调用方给的预估值
		const measured = ref<number>();

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

		// 把某一行滚动到可视范围：已完整可见时不动；否则 nearest 贴近离得近的一边，start 置顶
		const scrollToIndex = (index: number, align: SelectListAlign = 'nearest') => {
			if (index < 0) return;
			if (!props.virtualized) return scrollIntoScroller(getRow(index), align);
			recycleList?.scrollToIndex(index, { align, ifNeeded: true });
		};

		// 默认渲染时上一次指针所在的行及其下标：在同一行内移动不必再在全部行中查找
		let lastRow: Element | null = null;
		let lastIndex = -1;

		// 指针所在的行：虚拟化时为登记过的行节点，否则为根节点的哪一个子元素
		const getIndex = (target: Element) => {
			let el: Element | null = target;
			if (props.virtualized) {
				while (el && el !== root.value && !indexes.has(el)) el = el.parentElement;
				return el && indexes.has(el) ? indexes.get(el)! : -1;
			}
			const children = root.value!.children;
			while (el && el.parentElement !== root.value) el = el.parentElement;
			if (!el) return -1;
			// 行可能随数据移动：缓存的下标仍对得上才沿用
			if (el !== lastRow || children[lastIndex] !== el) {
				lastRow = el;
				lastIndex = Array.prototype.indexOf.call(children, el);
			}
			return lastIndex;
		};

		const handleMousemove = (e: MouseEvent) => {
			const index = getIndex(e.target as Element);
			index !== -1 && index !== active && emit('hover', index);
		};

		// 数据变化后行随之增减、移动：高亮按下标重新对上（虚拟化时由行的钩子处理）；
		// 挂载时同理：调用方的 ref 回调可能先于本组件的根节点就绪而设置了高亮
		const sync = () => !props.virtualized && mark(getRow(active));
		watch(() => props.data, sync, { flush: 'post' });
		onMounted(sync);

		// 滚动期间的标记：带动了列表的滚动才算（所在的滚动容器或页面）
		useScrollIdle({
			isRelevant: target => !!root.value && isScrollOf(target, root.value),
			onStart: () => root.value?.classList.add('is-scrolling'),
			onEnd: () => root.value?.classList.remove('is-scrolling')
		});

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

		/**
		 * RecycleList 按实际尺寸校正了行：取已渲染行中最矮的高度作为其余行的预估值
		 * 	- 预估值不对时，未渲染的行按它排布，滚动条长度与远处的定位都有偏差；调用方难以给准（主题、自定义渲染、复选框等前缀）
		 * 	- 取最矮的：个别行因额外内容变高（如树正在展开的行带着动画块）时不影响其余行的估计
		 * 	- 只在高度变化时更新，一般只发生一次
		 */
		const handleRowResize = () => {
			let height = 0;
			rows.forEach((el) => {
				const value = (el as HTMLElement).offsetHeight;
				value && (height = height ? Math.min(height, value) : value);
			});
			height && measured.value !== height && (measured.value = height);
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
				<div ref={root} class="vc-select-list" onMousemove={handleMousemove}>
					{
						props.virtualized
							? (
									<RecycleList
										ref={(v: any) => (recycleList = v)}
										fill={false}
										disabled
										data={props.data}
										estimateSize={measured.value || ESTIMATE_SIZE}
										onRow-resize={handleRowResize}
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
