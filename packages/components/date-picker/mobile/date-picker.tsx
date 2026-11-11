/** @jsxImportSource vue */

import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { props as datePickerProps } from './date-picker-props';
import { MDatePickerPortal } from './date-picker-core';
import { createContext, formatPoints, formatPointsText, parsePoints } from './utils';

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
		const { t } = useLocale();
		const extra = computed(() => props.extra ?? t('vc.DatePicker.placeholder'));
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<any>(props.modelValue);
		const pickerInstance = ref<any>();

		const context = computed(() => createContext(props, t));
		const points = computed(() => parsePoints(currentValue.value, context.value));

		// 范围用 separator 连接起止；季度显示季度名
		const formatterValue = computed(() => {
			if (!points.value.length) return extra.value;

			const value = formatPoints(points.value, context.value, props.nullValue);
			const customValue = props.formatter?.(value, context.value.format, points.value);

			return customValue || formatPointsText(points.value, context.value) || extra.value;
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
				disabledDate: props.disabledDate,
				timePickerOptions: props.timePickerOptions,
				steps: props.steps,
				yearRange: props.yearRange,
				separator: props.separator,
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
