/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as progressProps } from './progress-props';

const COMPONENT_NAME = 'vc-progress';

export const Progress = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-progress">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
