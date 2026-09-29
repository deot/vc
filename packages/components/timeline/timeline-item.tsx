/** @jsxImportSource vue */

import { defineComponent, computed, inject } from 'vue';
import { props as timelineItemProps } from './timeline-item-props';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-timeline-item';

export const TimelineItem = defineComponent({
	name: COMPONENT_NAME,
	props: timelineItemProps,
	setup(props, { slots }) {
		const timeline = inject('vc-timeline', { opposite: false });

		const isOpposite = computed(() => {
			return props.opposite ?? timeline.opposite;
		});

		// 实心/空心均通过currentColor取色
		const dotStyle = computed(() => {
			return props.dotColor ? { color: props.dotColor } : {};
		});

		const lineStyle = computed(() => {
			return props.lineColor ? { borderColor: props.lineColor } : {};
		});

		/**
		 * 插槽优先，其次字符串（innerHTML）或函数（Customer）
		 * @param key ~
		 * @returns ~
		 */
		const renderContent = (key: 'dot' | 'label') => {
			const value = props[key];
			if (slots[key]) return slots[key]!();
			return typeof value === 'function'
				? (<Customer render={value} />)
				: (<span innerHTML={value} />);
		};

		const renderDot = () => {
			if (!slots.dot && !props.dot) {
				return (
					<div
						class={['vc-timeline-item__dot', `is-${props.dotType}`]}
						style={dotStyle.value}
					/>
				);
			}
			return (
				<div class="vc-timeline-item__dot-custom">
					{ renderContent('dot') }
				</div>
			);
		};

		const renderLabel = () => {
			if (!slots.label && !props.label) return null;
			return (
				<div class="vc-timeline-item__label">
					{ renderContent('label') }
				</div>
			);
		};

		return () => {
			return (
				<div
					class={['vc-timeline-item', { 'is-opposite': isOpposite.value }]}
					role="listitem"
				>
					<div class="vc-timeline-item__dot-wrapper">
						<div
							class={['vc-timeline-item__line', `is-${props.lineType}`]}
							style={lineStyle.value}
						/>
						<div class="vc-timeline-item__dot-content">
							{ renderDot() }
						</div>
					</div>
					<div class="vc-timeline-item__content-wrapper">
						{
							slots.default && (
								<div class="vc-timeline-item__content">
									{ slots.default() }
								</div>
							)
						}
						{ !isOpposite.value && renderLabel() }
					</div>
					{ isOpposite.value && renderLabel() }
				</div>
			);
		};
	}
});
