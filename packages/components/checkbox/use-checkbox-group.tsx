/** @jsxImportSource vue */

import { provide, inject, ref, watch, computed } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './checkbox-group-props';
import { isEqualWith } from 'lodash-es';

export const useCheckboxGroup = (props: Props, context: SetupContext<['update:modelValue', 'change']>, options: { name: string }) => {
	const { emit, slots } = context;
	const { name } = options;
	const formItem = inject<any>('vc-form-item', {});

	const currentValue = ref<any>([]);

	// 达到上限：未选中的项不可再选
	const isFull = computed(() => {
		return props.max > 0 && currentValue.value.length >= props.max;
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
		const index = currentValue.value.indexOf(v);
		if (index !== -1) {
			currentValue.value.splice(index, 1);
		} else if (!isFull.value) {
			currentValue.value.push(v);
		}
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

	provide('vc-checkbox-group', {
		props,
		slots,
		currentValue,
		isFull,
		reset,
		sync
	});

	return () => {
		if (props.styleless) return slots.default?.();
		return (
			<div class={[{ 'is-vertical': props.vertical }, name]}>
				{ slots.default?.() }
			</div>
		);
	};
};
