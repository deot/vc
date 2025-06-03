/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as progressProps } from './progress-props';

const COMPONENT_NAME = 'vc-progress-circle';

export const Circle = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props, { slots }) {
		const circleBoxSize = computed(() => {
			return `position: relative; width: ${props.size}px; height: ${props.size}px`;
		});

		const radius = computed(() => {
			return 50 - props.strokeWidth / 2;
		});

		const len = computed(() => {
			return Math.PI * 2 * radius.value;
		});

		const pathString = computed(() => {
			return `M 50,50 m 0,-${radius.value}
			a ${radius.value},${radius.value} 0 1 1 0,${2 * radius.value}
			a ${radius.value},${radius.value} 0 1 1 0,-${2 * radius.value}`;
		});

		const pathStyle = computed(() => {
			const style = {
				'stroke-dasharray': `${len.value}px ${len.value}px`,
				'stroke-dashoffset': `${((100 - Number(props.percent)) / 100) * len.value}px`,
				'transition': 'stroke-dashoffset 0.6s ease 0s, stroke 0.6s ease'
			};
			return style;
		});
		return () => {
			return (
				<div class="vc-progress-circle">
					<div class="vc-progress-circle__box" style={circleBoxSize.value}>
						<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
							<path
								d={pathString.value}
								stroke-width={props.strokeWidth}
								stroke={props.trackColor}
								fill-opacity="0"
							/>
							<path
								d={pathString.value}
								style={pathStyle.value}
								stroke-width={props.strokeWidth}
								stroke={props.color as string}
								stroke-linecap="round"
								fill-opacity="0"
							/>
						</svg>
						<div class="vc-progress-circle__inner">
							{
								slots.default
									? slots.default()
									: (<span>{`${props.percent}%`}</span>)
							}
						</div>
					</div>
				</div>
			);
		};
	}
});
