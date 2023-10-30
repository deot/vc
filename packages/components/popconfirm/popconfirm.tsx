/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as popconfirmProps } from './popconfirm-props';

const COMPONENT_NAME = 'vc-popconfirm';

export const Popconfirm = defineComponent({
	name: COMPONENT_NAME,
	props: popconfirmProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class="vc-popconfirm">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
