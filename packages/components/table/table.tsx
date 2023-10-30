/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as tableProps } from './table-props';

const COMPONENT_NAME = 'vc-table';

export const Table = defineComponent({
	name: COMPONENT_NAME,
	props: tableProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-table">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
