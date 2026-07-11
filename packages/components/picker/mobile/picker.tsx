/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { isEqualWith } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { VcError } from '../../vc';
import { props as pickerProps } from './picker-props';
import { PickerPortal } from './picker-core';
import { getSelectedData } from './utils';
import type { PickerModelValue, PickerValue } from '../types';

const COMPONENT_NAME = 'vcm-picker';

export const Picker = defineComponent({
	name: COMPONENT_NAME,
	props: pickerProps,
	emits: [
		'update:modelValue',
		'visible-change',
		'picker-change',
		'ok',
		'cancel',
		'change',
		'close'
	],
	setup(props, { emit, slots }) {
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<PickerValue[]>([]);
		const pickerInstance = ref<any>();

		const source = computed(() => props.data || []);

		const formatterValue = computed(() => {
			const { label = [] } = getSelectedData(currentValue.value, source.value);
			return props.formatter(label) || props.extra;
		});

		watch(
			() => props.modelValue,
			(v) => {
				const next = toCurrentValue(v as any, {
					numerable: props.numerable,
					separator: props.separator
				}) as PickerValue[];
				if (isEqualWith(next, currentValue.value)) return;

				currentValue.value = next;
			},
			{ immediate: true, deep: true }
		);

		onBeforeUnmount(() => {
			pickerInstance.value?.destroy?.();
		});

		const sync = (label: any[], data: any[]) => {
			const value = toModelValue(currentValue.value.slice(0) as any, {
				modelValue: props.modelValue as any,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue,
				max: props.cols
			}) as PickerModelValue;

			emit('update:modelValue', value, label, data);
			emit('change', value, label, data);
			formItem?.change?.(value);
		};

		const handleClick = async () => {
			try {
				if ((!source.value || source.value.length === 0) && props.loadData) {
					await props.loadData();
					await nextTick();
				}

				pickerInstance.value = PickerPortal.popup({
					data: source.value,
					cols: props.cols,
					cascader: props.cascader,
					itemStyle: props.itemStyle,
					title: props.title,
					cancelText: props.cancelText,
					showToolbar: props.showToolbar,
					okText: props.okText,
					modelValue: currentValue.value.slice(0),
					renderLabel: props.renderLabel,
					onVisibleChange: (v: boolean) => emit('visible-change', v),
					onPickerChange: (v: PickerValue, index: number, row: any) => emit('picker-change', v, index, row),
					onClose: () => emit('close'),
					onOk: (value: PickerModelValue, label: any[], data: any[]) => {
						const next = toCurrentValue(value as any, {
							numerable: props.numerable,
							separator: props.separator
						}) as PickerValue[];
						const modelValue = toModelValue(next as any, {
							modelValue: props.modelValue as any,
							numerable: props.numerable,
							separator: props.separator,
							nullValue: props.nullValue,
							max: props.cols
						}) as PickerModelValue;

						currentValue.value = next;
						emit('ok', modelValue, label, data);
						sync(label, data);
					},
					onCancel: () => emit('cancel')
				});
			} catch (e) {
				throw new VcError('picker', e);
			}
		};

		return () => {
			return (
				<div class="vcm-picker" onClick={handleClick}>
					{
						slots.default
							? slots.default({
									label: formatterValue.value,
									value: currentValue.value,
									data: source.value
								})
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										extra={formatterValue.value}
									/>
								)
					}
				</div>
			);
		};
	}
});
