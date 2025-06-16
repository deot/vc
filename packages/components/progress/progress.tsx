/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as progressProps } from './progress-props';
import { Circle } from './circle';
import { Line } from './line';

const COMPONENT_NAME = 'vc-progress';

export const Progress = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props, { slots }) {
		const currentPercent = computed(() => {
			const v = Number(props.percent);
			return v >= 100 ? 100 : v;
		});
		const currentStatus = computed(() => {
			if (currentPercent.value === 100) {
				return 'success';
			}
			return props.status;
		});

		const currentColor = computed(() => {
			if (typeof props.color === 'string') return props.color;
			return props.color[currentStatus.value];
		});

		const binds = computed(() => {
			return {
				...props,
				percent: currentPercent.value,
				status: currentStatus.value,
				color: currentColor.value
			};
		});

		return () => {
			return (
				<div class="vc-progress">
					{
						props.type === 'line'
							? (<Line {...binds.value} />)
							: (<Circle {...binds.value}>{ slots }</Circle>)
					}
				</div>
			);
		};
	}
});
