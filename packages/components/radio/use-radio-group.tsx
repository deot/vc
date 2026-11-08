/** @jsxImportSource vue */

import { provide, inject, ref, watch, computed } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './radio-group-props';
import { isEqualWith } from 'lodash-es';

export const useRadioGroup = (props: Props, context: SetupContext<['update:modelValue', 'change']>, options: { name: string }) => {
	const { emit, slots } = context;
	const { name } = options;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>('');
	const classes = computed(() => {
		return {
			'is-vertical': props.vertical,
			[`is-${props.type}`]: props.type !== 'default'
		};
	});

	watch(
		() => props.modelValue,
		(v) => {
			if (isEqualWith(v, currentValue.value)) {
				return;
			}
			currentValue.value = v;
		},
		{ immediate: true }
	);

	const reset = (v: any) => {
		currentValue.value = v;
	};

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 * @param e ~
	 */
	const sync = (e: any) => {
		emit('update:modelValue', currentValue.value, e, reset);
		emit('change', currentValue.value, e, reset);

		formItem?.change?.(currentValue.value);
	};

	provide('vc-radio-group', {
		props,
		currentValue,
		reset,
		sync
	});

	return () => {
		if (props.styleless) return slots.default?.();
		return (
			<div
				class={[classes.value, name]}
				// @ts-ignore
				name={props.name}
			>
				{ slots.default?.() }
			</div>
		);
	};
};
