/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as sortListProps } from './sort-list-props';

const COMPONENT_NAME = 'vc-sort-list';

export const SortList = defineComponent({
	name: COMPONENT_NAME,
	props: sortListProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-sort-list">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
