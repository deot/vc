/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as artboardProps } from './artboard-props';

const COMPONENT_NAME = 'vc-artboard';

export const Artboard = defineComponent({
	name: COMPONENT_NAME,
	props: artboardProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-artboard">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
