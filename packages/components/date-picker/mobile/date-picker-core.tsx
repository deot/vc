/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { useLocale } from '../../locale';
import { MPickerPopup } from '../../picker/index.m';
import { MDatePickerView } from './date-picker-view';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as datePickerViewProps } from './date-picker-view-props';
import { createContext, formatPoints, resolvePoints } from './utils';
import type { PropType } from 'vue';

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
		visible: {
			type: Boolean,
			default: true
		},
		onOk: Function as PropType<(value: any) => void>,
		onCancel: Function as PropType<() => void>
	},
	emits: [
		'update:modelValue',
		'update:visible',
		'change',
		'cancel',
		'ok',
		'close',
		'portal-fulfilled',
		'picker-change',
		'visible-change'
	],
	setup(props, { emit }) {
		const { t } = useLocale();
		const isActive = ref(false);
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

		watch(
			() => props.visible,
			(v) => {
				isActive.value = v;
			}
		);

		watch(
			() => isActive.value,
			(v) => {
				emit('visible-change', v);
				emit('update:visible', v);
			}
		);

		onMounted(() => {
			isActive.value = props.visible !== false;
		});

		const handleClose = () => {
			isActive.value = false;
			emit('close');
			emit('portal-fulfilled');
			emit('update:visible', false);
		};

		const handleOk = () => {
			const value = getNormalizedValue(currentValue.value);

			currentValue.value = value;
			isActive.value = false;
			props.onOk ? props.onOk(value) : emit('ok', value);
			emit('update:modelValue', value);
			emit('change', value);
		};

		// 不需要确认：滚轮停下即提交，弹层保持打开
		const handleViewChange = (v: any) => {
			currentValue.value = v;
			if (props.confirm) return;

			const value = getNormalizedValue(v);
			emit('update:modelValue', value);
			emit('change', value);
		};

		const handleCancel = () => {
			isActive.value = false;
			props.onCancel ? props.onCancel() : emit('cancel');
		};

		return () => {
			return (
				<MPickerPopup
					modelValue={isActive.value}
					title={props.title}
					cancelText={props.cancelText ?? t('vc.DatePicker.cancelText')}
					okText={props.okText ?? t('vc.DatePicker.okText')}
					confirm={props.confirm}
					onOk={handleOk}
					onCancel={handleCancel}
					onClose={handleClose}
					onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
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
