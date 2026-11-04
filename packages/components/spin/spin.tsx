/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as spinProps } from './spin-props';
import { renderSpin } from './render-spin';

const COMPONENT_NAME = 'vc-spin';

export const Spin = defineComponent({
	name: COMPONENT_NAME,
	props: spinProps,
	setup(props, { slots }) {
		return () => renderSpin({ props, slots, size: `${props.size}px`, className: COMPONENT_NAME });
	}
});
