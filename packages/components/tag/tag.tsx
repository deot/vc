/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as tagProps } from './tag-props';

const COMPONENT_NAME = 'vc-tag';

export const Tag = defineComponent({
	name: COMPONENT_NAME,
	props: tagProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-tag">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
