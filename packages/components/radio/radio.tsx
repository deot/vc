/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as radioProps } from './radio-props';

const COMPONENT_NAME = 'vc-radio';

export const Radio = defineComponent({
	name: COMPONENT_NAME,
	props: radioProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-radio">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
