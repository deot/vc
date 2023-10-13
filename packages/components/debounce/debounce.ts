/** @jsxImportSource vue */

import { defineComponent, h, computed } from 'vue';
import { debounce, upperFirst } from 'lodash-es';
import { props as debounceProps } from './debounce-props';

const COMPONENT_NAME = 'vc-debounce';

export const Debounce = defineComponent({
	name: COMPONENT_NAME,
	props: debounceProps,
	// 控制tag自定义时能传递参数
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const listener = computed(() => {
			const { wait, event } = props;
			const eventName = `on${upperFirst(event)}`;
			const callback = attrs[eventName];

			if (typeof callback === 'function') {
				return {
					[eventName]: debounce(callback, wait, {
						leading: true,
						trailing: false
					})
				};
			}
		});

		return () => {
			return h(props.tag, {
				...attrs,
				...listener.value
			}, slots.default?.());
		};
	}
});