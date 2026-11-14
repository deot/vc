/** @jsxImportSource vue */

import { defineComponent, onMounted, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { PickerPopup } from './picker-popup';
import { PickerView } from './picker-view';
import { props as pickerPopupProps } from './picker-popup-props';
import { props as pickerViewProps } from './picker-view-props';
import { getSelectedData } from './utils';
import type { PickerModelValue, PickerValue } from '../types';
import type { PropType } from 'vue';

const COMPONENT_NAME = 'vcm-picker-core';

const popupKeys = [
	'title',
	'cancelText',
	'okText',
	'confirm'
] as const;

const viewKeys = [
	'modelValue',
	'data',
	'itemStyle',
	'columns',
	'cascader',
	'hideEmptyColumns',
	'renderLabel',
	'separator',
	'numerable',
	'nullValue'
] as const;

export const PickerCore = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
		...(pick(pickerViewProps, viewKeys) as Pick<typeof pickerViewProps, typeof viewKeys[number]>),
		visible: {
			type: Boolean,
			default: true
		},
		onOk: Function as PropType<(value: PickerModelValue, label: any[], data: any[]) => void>,
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
		const currentValue = ref<PickerValue[]>([]);

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = toCurrentValue(v as any, {
					numerable: props.numerable,
					separator: props.separator
				}) as PickerValue[];
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

		const getCommitted = () => {
			const value = currentValue.value.slice(0);
			const modelValue = toModelValue(value as any, {
				modelValue: props.modelValue as any,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue,
				max: props.columns
			}) as PickerModelValue;
			return { modelValue, ...getSelectedData(value, props.data) };
		};

		const handleOk = () => {
			const { modelValue, label, data } = getCommitted();

			isActive.value = false;
			props.onOk ? props.onOk(modelValue, label, data) : emit('ok', modelValue, label, data);
			emit('update:modelValue', modelValue, label, data);
			emit('change', modelValue, label, data);
		};

		// 不需要确认：滚轮停下即提交，弹层保持打开
		const handleViewChange = (v: PickerModelValue) => {
			currentValue.value = toCurrentValue(v as any, {
				numerable: props.numerable,
				separator: props.separator
			}) as PickerValue[];
			if (props.confirm) return;

			const { modelValue, label, data } = getCommitted();
			emit('update:modelValue', modelValue, label, data);
			emit('change', modelValue, label, data);
		};

		const handleCancel = () => {
			isActive.value = false;
			props.onCancel ? props.onCancel() : emit('cancel');
		};

		return () => {
			return (
				<PickerPopup
					modelValue={isActive.value}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
					confirm={props.confirm}
					onOk={handleOk}
					onCancel={handleCancel}
					onClose={handleClose}
					onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
				>
					<PickerView
						modelValue={currentValue.value}
						data={props.data}
						columns={props.columns}
						itemStyle={props.itemStyle}
						cascader={props.cascader}
						hideEmptyColumns={props.hideEmptyColumns}
						allowDispatch={false}
						renderLabel={props.renderLabel}
						separator={props.separator}
						numerable={props.numerable}
						nullValue={props.nullValue}
						onUpdate:modelValue={handleViewChange}
						{...{
							'onPicker-change': (v: PickerValue, index: number, row: any) => emit('picker-change', v, index, row)
						}}
					/>
				</PickerPopup>
			);
		};
	}
});

export const PickerPortal = new Portal(PickerCore, {
	promise: false
});
