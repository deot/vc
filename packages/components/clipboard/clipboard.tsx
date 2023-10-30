/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as clipboardProps } from './clipboard-props';

const COMPONENT_NAME = 'vc-clipboard';

export const Clipboard = defineComponent({
	name: COMPONENT_NAME,
	props: clipboardProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-clipboard">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
