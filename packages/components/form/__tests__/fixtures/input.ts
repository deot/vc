/** @jsxImportSource vue */

import { defineComponent, h, inject } from 'vue';

export const Input = defineComponent({
	name: 'f-input',
	props: {
		modelValue: [String, Number]
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const formItem = inject('vc-form-item') as any;
		return () => {
			return h(
				'input',
				{
					value: props.modelValue,
					onInput: (e: any) => {
						emit('update:modelValue', e.target.value);

						// form表单
						formItem.change?.(props.modelValue);
					},
					onBlur: () => {
						// form表单
						formItem.blur?.(props.modelValue);
					}
				}
			);
		};
	}
});
