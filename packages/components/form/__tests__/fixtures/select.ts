/** @jsxImportSource vue */
import { defineComponent, h, inject, toRaw } from 'vue';

export const Select = defineComponent({
	name: 'f-select',
	props: {
		modelValue: {
			type: Array,
			default: () => []
		}
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const formItem = inject('form-item') as any;
		const items = ['a', 'b', 'c', 'd'];

		return () => {
			return items.map((item) => {
				return h(
					'div',
					{
						key: item,
						class: item,
						onClick: () => {
							/**
							 * 注意：引用对象发生变化UI才会触发更新，值变化，引用不变无法更新，除非由v3内部的钩子（如push才行）
							 * 不用toRaw可以使用push, 内部有钩子
							 * 用toRaw不可以使用push, 同一引用且无钩子
							 */
							let v = toRaw(props.modelValue) || [];
							if (!v.includes(item)) {
								v = v.concat([item]);
							} else {
								v = v.filter((it) => it !== item);
							}
							
							emit('update:modelValue', v);
							formItem.change?.(v);
						}
					}
				);
			});
		};
	}
});
