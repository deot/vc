/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as actionSheetProps } from './action-sheet-props';

const COMPONENT_NAME = 'vc-action-sheet';

export const ActionSheet = defineComponent({
	name: COMPONENT_NAME,
	props: actionSheetProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-action-sheet">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
