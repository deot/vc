/** @jsxImportSource vue */

import { defineComponent, h, Fragment as Fragment_ } from 'vue';

const COMPONENT_NAME = 'vc-fragment';

/**
 * 原生支持Fragment, 这里仅作为语义化
 * 写法不同，但与vue@2.x 保持一致
 */
export const Fragment = defineComponent({
	name: COMPONENT_NAME,
	setup(_, { slots }) {
		return () => h(Fragment_, slots.default?.());
	}
});
