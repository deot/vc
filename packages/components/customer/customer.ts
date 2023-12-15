/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as customerProps } from './customer-props';

const COMPONENT_NAME = 'vc-customer';

/**
 * 原生支持render, 这里仅作为语义化
 * 写法不同，但与vue@2.x 保持一致
 */
export const Customer = defineComponent({
	name: COMPONENT_NAME,
	props: customerProps,
	setup(props, context) {
		return () => h(() => {
			return props.render(context.attrs, context);
		});
	}
});
