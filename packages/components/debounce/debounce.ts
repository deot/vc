/** @jsxImportSource vue */

import { defineComponent, h, watch, ref } from 'vue';
import { debounce, upperFirst } from 'lodash-es';
import { props as debounceProps } from './debounce-props';

const COMPONENT_NAME = 'vc-debounce';

export const Debounce = defineComponent({
	name: COMPONENT_NAME,
	props: debounceProps,
	// 控制tag自定义时能传递参数
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const listener = ref({});

		// 这里使用watch, 不使用computed。（computed的话，`@vue/test-utils` 多次click时重置了）
		watch(
			[() => props.wait, () => props.event], 
			() => {
				const { wait, event } = props;
				const eventName = `on${upperFirst(event)}`;
				const callback = attrs[eventName];

				if (typeof callback === 'function') {
					listener.value = {
						[eventName]: debounce(callback, wait, {
							leading: true,
							trailing: false
						})
					};
				} else {
					listener.value = {};
				}
			},
			{
				immediate: true
			}
		);

		return () => {
			return h(props.tag, {
				...attrs,
				...listener.value
			}, slots.default?.());
		};
	}
});