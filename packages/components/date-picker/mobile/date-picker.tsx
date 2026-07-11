/** @jsxImportSource vue */

import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue';
import { MListItem } from '../../list/index.m';
import { props as datePickerProps } from './date-picker-props';
import { MDatePickerPortal } from './date-picker-core';
import {
	formatDatesToModelValue,
	formatDatesToText,
	getEffectiveFormat,
	parseModelValueToDates
} from './utils';

const COMPONENT_NAME = 'vcm-date-picker';

export const MDatePicker = defineComponent({
	name: COMPONENT_NAME,
	props: datePickerProps,
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
		const currentValue = ref<any>(props.modelValue);
		const pickerInstance = ref<any>();

		const dates = computed(() => {
			return parseModelValueToDates(currentValue.value, props.type, props.format);
		});

		const formatterValue = computed(() => {
			if (!dates.value.length) return props.extra;

			const value = formatDatesToModelValue(dates.value, props.type, props.format, props.nullValue);
			const customValue = props.formatter?.(
				value,
				getEffectiveFormat(props.type, props.format),
				dates.value
			);

			return customValue || formatDatesToText(dates.value, props.type, props.format) || props.extra;
		});

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			},
			{ deep: true }
		);

		onBeforeUnmount(() => {
			pickerInstance.value?.destroy?.();
		});

		const sync = (value: any) => {
			currentValue.value = value;
			emit('update:modelValue', value);
			emit('change', value);
			formItem?.change?.(value);
		};

		const handleClick = () => {
			pickerInstance.value = MDatePickerPortal.popup({
				type: props.type,
				format: props.format,
				minDate: props.minDate,
				maxDate: props.maxDate,
				startHour: props.startHour,
				endHour: props.endHour,
				title: props.title,
				cancelText: props.cancelText,
				okText: props.okText,
				showToolbar: props.showToolbar,
				nullValue: props.nullValue,
				modelValue: currentValue.value,
				onVisibleChange: (v: boolean) => emit('visible-change', v),
				onPickerChange: (v: any, index: number, row: any) => emit('picker-change', v, index, row),
				onClose: () => emit('close'),
				onOk: (value: any) => {
					emit('ok', value);
					sync(value);
				},
				onCancel: () => emit('cancel')
			});
		};

		return () => {
			return (
				<div class="vcm-date-picker" onClick={handleClick}>
					{
						slots.default
							? slots.default({
									label: formatterValue.value,
									value: currentValue.value
								})
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										arrow={props.arrow}
										extra={formatterValue.value}
									/>
								)
					}
				</div>
			);
		};
	}
});
