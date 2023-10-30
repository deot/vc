/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as stepsProps } from './steps-props';

const COMPONENT_NAME = 'vc-steps';

export const Steps = defineComponent({
	name: COMPONENT_NAME,
	props: stepsProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-steps">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
