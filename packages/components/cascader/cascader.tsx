/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as cascaderProps } from './cascader-props';

const COMPONENT_NAME = 'vc-cascader';

export const Cascader = defineComponent({
	name: COMPONENT_NAME,
	props: cascaderProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-cascader">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
