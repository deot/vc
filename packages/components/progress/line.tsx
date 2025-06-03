/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { props as progressProps } from './progress-props';
import { Icon } from '../icon';

const COMPONENT_NAME = 'vc-progress-line';

export const Line = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props) {
		const colorStyle = computed(() => {
			return `color: ${props.color}`;
		});

		const innerStyle = computed(() => {
			return `height: ${props.strokeWidth}px; width: ${Number(props.percent)}%; background-color: ${props.color}`;
		});

		const classes = computed(() => {
			return {
				[`is-${props.status}`]: true,
				[`is-active`]: props.animated
			};
		});

		return () => {
			return (
				<div class="vc-progress-line">
					<div class={[{ 'has-text': props.showText }, 'vc-progress-line__wrapper']}>
						<div style={`background-color: ${props.trackColor}`} class={[classes.value, 'vc-progress-line__box']}>
							<div
								style={innerStyle.value}
								class={[classes.value, 'vc-progress-line__inner']}
							/>
						</div>
					</div>
					{
						props.showText && (
							<div class="vc-progress-line__percent">
								{
									['error', 'success'].includes(props.status)
										? (
												<Icon
													type={props.status}
													style={colorStyle.value}
													class={[`is-${props.status}`, 'vc-progress-line__icon']}
												/>
											)
										: (<span>{`${props.percent}%`}</span>)
								}
							</div>
						)
					}
				</div>
			);
		};
	}
});
