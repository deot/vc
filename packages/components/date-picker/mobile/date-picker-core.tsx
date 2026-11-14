/** @jsxImportSource vue */

import { defineComponent, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { useLocale } from '../../locale';
import { MPickerPopup } from '../../picker/index.m';
import { MDatePickerView } from './date-picker-view';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { pickerCoreProps, pickerCoreEmits, usePickerCore } from '../../picker/mobile/use-picker-portal';
import { props as datePickerViewProps } from './date-picker-view-props';
import { createContext, formatPoints, resolvePoints } from './utils';

const COMPONENT_NAME = 'vcm-date-picker-core';

const popupKeys = [
	'title',
	'cancelText',
	'okText',
	'confirm'
] as const;

const viewKeys = [
	'modelValue',
	'type',
	'format',
	'disabledDate',
	'timePickerOptions',
	'steps',
	'yearRange',
	'separator',
	'nullValue'
] as const;

export const MDatePickerCore = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
		...(pick(datePickerViewProps, viewKeys) as Pick<typeof datePickerViewProps, typeof viewKeys[number]>),
		cancelText: String,
		okText: String,
		...pickerCoreProps
	},
	emits: [...pickerCoreEmits, 'picker-change'],
	setup(props, setupContext) {
		const { emit } = setupContext;
		const { t } = useLocale();
		const core = usePickerCore(props, setupContext);
		const currentValue = ref<any>('');

		// 弹层打开时没有值或值落在禁用项上：校正后作为确定时提交的值（与视图显示的一致）
		const getNormalizedValue = (value: any) => {
			const context = createContext(props);
			return formatPoints(resolvePoints(value, context), context, props.nullValue);
		};

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = getNormalizedValue(v);
			},
			{ immediate: true, deep: true }
		);

		const handleOk = () => {
			const value = getNormalizedValue(currentValue.value);

			currentValue.value = value;
			core.ok(value);
		};

		// 不需要确认：滚轮停下即提交，弹层保持打开
		const handleViewChange = (v: any) => {
			currentValue.value = v;
			if (props.confirm) return;

			core.commit(getNormalizedValue(v));
		};

		return () => {
			return (
				<MPickerPopup
					{...core.getPopupProps()}
					title={props.title}
					cancelText={props.cancelText ?? t('vc.DatePicker.cancelText')}
					okText={props.okText ?? t('vc.DatePicker.okText')}
					confirm={props.confirm}
					onOk={handleOk}
				>
					<MDatePickerView
						modelValue={currentValue.value}
						type={props.type}
						format={props.format}
						disabledDate={props.disabledDate}
						timePickerOptions={props.timePickerOptions}
						steps={props.steps}
						yearRange={props.yearRange}
						separator={props.separator}
						nullValue={props.nullValue}
						allowDispatch={false}
						// @ts-ignore
						onPickerChange={(v: any, index: number, row: any) => emit('picker-change', v, index, row)}
						onUpdate:modelValue={handleViewChange}
					/>
				</MPickerPopup>
			);
		};
	}
});

export const MDatePickerPortal = new Portal(MDatePickerCore, {
	promise: false
});
