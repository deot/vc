/** @jsxImportSource vue */

import { defineComponent, computed, provide } from 'vue';
import { props as buttonGroupProps } from './button-group-props';

const COMPONENT_NAME = 'vc-button-group';

export const ButtonGroup = defineComponent({
	name: COMPONENT_NAME,
	props: buttonGroupProps,
	setup(props, { slots }) {
		provide('button-group', props);

		const classes = computed(() => (
			{
				'is-vertical': props.vertical,
				'is-circle': props.circle,
				[`is-${props.size}`]: !!props.size
			}
		));

		return () => {
			return props.fragment 
				? slots?.default?.() 
				: (
					<div class={{ 'vc-button-group': true, ...classes.value }}>
						{slots?.default?.()}
					</div>
				);
		};
	}
});