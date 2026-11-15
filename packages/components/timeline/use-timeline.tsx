/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { provide, h, cloneVNode } from 'vue';
import { toRem } from '@deot/vc-shared';
import { getChildren } from '../fragment/utils';
import type { Props } from './timeline-props';
import { TimelineItem } from './timeline-item';
import { Spin } from '../spin';

/**
 * Timeline 与 MTimeline 共用；TimelineItem 通过注入键 vc-timeline 读取
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MTimeline）：根节点加标记类 vcm-timeline，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useTimeline = (
	props: Props,
	{ slots }: SetupContext,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-timeline vcm-timeline' : 'vc-timeline';
	// 幽灵节点的加载图标：桌面端 12px，移动端 750 稿 24
	const spinSize = options.mobile ? toRem(24) : 12;

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
		const items = getChildren(slots.default?.(), [TimelineItem]);

		if (props.showPending) {
			items.push(
				<TimelineItem class="is-pending">
					{{
						default: slots.pending,
						dot: () => slots['pending-dot']?.() || (<Spin size={spinSize} />)
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
					name,
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
};
