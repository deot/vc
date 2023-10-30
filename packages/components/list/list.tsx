/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as listProps } from './list-props';

const COMPONENT_NAME = 'vc-list';

export const List = defineComponent({
	name: COMPONENT_NAME,
	props: listProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-list">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
