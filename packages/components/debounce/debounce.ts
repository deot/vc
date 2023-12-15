/** @jsxImportSource vue */

import { defineComponent, h, watch, ref } from 'vue';
import { debounce } from 'lodash-es';
import { props as debounceProps } from './debounce-props';

const COMPONENT_NAME = 'vc-debounce';

export const Debounce = defineComponent({
	name: COMPONENT_NAME,
	props: debounceProps,
	/**
	 * 不声明emits使得事件被透传放入attrs中, 这样可以让所有的事件透传
	 * 如事件onClick
	 * 当inheritAttrs为true时：因为emits为声明onClick会覆盖到`props.tag`上，使得我们重写的onClick无效
	 * 当inheritAttrs为false时: 透传的onClick不会被重载，这样我们就可以重写onClick
	 */
	inheritAttrs: false,
	setup(props, { slots, attrs }) {
		const listener = ref({});
		// 这里使用watch, 不使用computed。（computed的话，`@vue/test-utils` 多次click时重置了）
		watch(
			[() => props.wait, () => props.exclude, () => props.include],
			() => {
				const { wait, exclude, include } = props;

				const ons = Object.entries(attrs).reduce((pre, [key, callback]) => {
					/* istanbul ignore else -- @preserve */
					if (
						(!exclude || !exclude.test(key))
						&& (!include || include.test(key))
						&& typeof callback === 'function'
					) {
						pre[key] = debounce(callback as any, wait, {
							leading: true,
							trailing: false
						});
					}
					return pre;
				}, {});

				if (Object.keys(listener.value).length !== Object.keys(ons).length) {
					listener.value = ons;
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
