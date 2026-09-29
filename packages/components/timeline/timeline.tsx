/** @jsxImportSource vue */

import { defineComponent, provide, h, cloneVNode, Fragment } from 'vue';
import type { VNode } from 'vue';
import { props as timelineProps } from './timeline-props';
import { TimelineItem } from './timeline-item';
import { Spin } from '../spin';

const COMPONENT_NAME = 'vc-timeline';

/**
 * 展开v-for, <template>产生的Fragment, 只保留TimelineItem
 * @param vnodes ~
 * @param items ~
 * @returns ~
 */
const getItems = (vnodes: VNode[] = [], items: VNode[] = []) => {
	vnodes.forEach((vnode) => {
		if (vnode.type === Fragment && Array.isArray(vnode.children)) {
			getItems(vnode.children as VNode[], items);
		} else if (vnode.type === TimelineItem) {
			items.push(vnode);
		}
	});
	return items;
};

export const Timeline = defineComponent({
	name: COMPONENT_NAME,
	props: timelineProps,
	setup(props, { slots }) {
		provide('vc-timeline', props);

		/**
		 * 轴线位于该项的哪一侧
		 * @param index ~
		 * @returns ~
		 */
		const getSide = (index: number) => {
			if (props.alternate) return index % 2 ? 'end' : 'start';
			return props.align === 'end' ? 'end' : 'start';
		};

		return () => {
			const items = getItems(slots.default?.());

			if (props.showPending) {
				items.push(
					<TimelineItem class="is-pending">
						{{
							default: slots.pending,
							dot: () => slots['pending-dot']?.() || (<Spin size={12} />)
						}}
					</TimelineItem>
				);
			}

			props.inverted && items.reverse();

			const align = props.alternate ? 'center' : props.align;
			// 与幽灵节点相连的轴线：倒序时为幽灵节点自身，否则为其前一项
			const dashedIndex = props.showPending ? (props.inverted ? 0 : items.length - 2) : -1;

			return h(
				props.tag,
				{
					class: [
						'vc-timeline',
						`is-${props.vertical ? 'vertical' : 'horizontal'}`,
						`is-${align}`,
						{ 'is-alternate': props.alternate }
					],
					role: 'list'
				},
				items.map((vnode, index) => {
					return cloneVNode(vnode, {
						class: [
							`is-${getSide(index)}`,
							{
								'is-horizontal': !props.vertical,
								'is-center': align === 'center',
								'is-last': index === items.length - 1
							}
						],
						...(index === dashedIndex ? { lineType: 'dashed' } : {})
					});
				})
			);
		};
	}
});
