/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as spinProps } from './spin-props';
import { renderSpin } from '../render-spin';

const COMPONENT_NAME = 'vcm-spin';

export const MSpin = defineComponent({
	name: COMPONENT_NAME,
	props: spinProps,
	setup(props, { slots }) {
		return () => renderSpin({ props, slots, size: `calc(var(--vc-rem) * ${props.size})`, className: COMPONENT_NAME });
	}
});
