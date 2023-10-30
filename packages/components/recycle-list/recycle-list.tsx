/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as recycleListProps } from './recycle-list-props';

const COMPONENT_NAME = 'vc-recycle-list';

export const RecycleList = defineComponent({
	name: COMPONENT_NAME,
	props: recycleListProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-recycle-list">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
