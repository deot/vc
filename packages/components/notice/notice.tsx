/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as noticeProps } from './notice-props';

const COMPONENT_NAME = 'vc-notice';

export const Notice = defineComponent({
	name: COMPONENT_NAME,
	props: noticeProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-notice">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
