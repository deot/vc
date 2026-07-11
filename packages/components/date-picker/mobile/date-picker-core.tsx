/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { MPickerPopup } from '../../picker/index.m';
import { MDatePickerView } from './date-picker-view';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { props as datePickerViewProps } from './date-picker-view-props';
import { normalizeModelValue } from './utils';
import type { PropType } from 'vue';

const COMPONENT_NAME = 'vcm-date-picker-core';

const popupKeys = [
	'title',
	'cancelText',
	'okText',
	'showToolbar'
] as const;

const viewKeys = [
	'modelValue',
	'type',
	'format',
	'minDate',
	'maxDate',
	'startHour',
	'endHour',
	'nullValue'
] as const;

export const MDatePickerCore = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
		...(pick(datePickerViewProps, viewKeys) as Pick<typeof datePickerViewProps, typeof viewKeys[number]>),
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
		const isActive = ref(false);
		const currentValue = ref<any>('');

		const getNormalizedValue = (value: any, force = true) => {
			return normalizeModelValue(
				value,
				props.type,
				props.format,
				props.minDate,
				props.maxDate,
				props.nullValue,
				force
			);
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

		const handleCancel = () => {
			isActive.value = false;
			props.onCancel ? props.onCancel() : emit('cancel');
		};

		return () => {
			return (
				<MPickerPopup
					modelValue={isActive.value}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
					showToolbar={props.showToolbar}
					onOk={handleOk}
					onCancel={handleCancel}
					onClose={handleClose}
					onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
				>
					<MDatePickerView
						modelValue={currentValue.value}
						type={props.type}
						format={props.format}
						minDate={props.minDate}
						maxDate={props.maxDate}
						startHour={props.startHour}
						endHour={props.endHour}
						nullValue={props.nullValue}
						allowDispatch={false}
						// @ts-ignore
						onPickerChange={(v: any, index: number, row: any) => emit('picker-change', v, index, row)}
						onUpdate:modelValue={(v: any) => (currentValue.value = v)}
					/>
				</MPickerPopup>
			);
		};
	}
});

export const MDatePickerPortal = new Portal(MDatePickerCore, {
	promise: false
});
