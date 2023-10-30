/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as textProps } from './text-props';

const COMPONENT_NAME = 'vc-text';

export const Text = defineComponent({
	name: COMPONENT_NAME,
	props: textProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-text">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
