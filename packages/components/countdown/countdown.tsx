/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as countdownProps } from './countdown-props';

const COMPONENT_NAME = 'vc-countdown';

export const Countdown = defineComponent({
	name: COMPONENT_NAME,
	props: countdownProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-countdown">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
