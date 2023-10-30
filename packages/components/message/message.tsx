/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as messageProps } from './message-props';

const COMPONENT_NAME = 'vc-message';

export const Message = defineComponent({
	name: COMPONENT_NAME,
	props: messageProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-message">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
