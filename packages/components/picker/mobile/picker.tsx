/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { isEqualWith } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { toCurrentValue, toModelValue } from '../../select/utils';
import { VcError } from '../../vc';
import { useLocale } from '../../locale';
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
		const { t } = useLocale();
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<PickerValue[]>([]);
		const pickerInstance = ref<any>();

		const source = computed(() => props.data || []);

		const formatterValue = computed(() => {
			const { label = [] } = getSelectedData(currentValue.value, source.value);
			return props.formatter(label) || (props.extra ?? t('vc.Picker.extra'));
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

		/**
		 * 弹层提交的值写回触发器，返回按外部 v-model 规范后的值
		 * @param value 弹层提交的值
		 * @returns ~
		 */
		const apply = (value: PickerModelValue) => {
			currentValue.value = toCurrentValue(value as any, {
				numerable: props.numerable,
				separator: props.separator
			}) as PickerValue[];
			return toModelValue(currentValue.value.slice(0) as any, {
				modelValue: props.modelValue as any,
				numerable: props.numerable,
				separator: props.separator,
				nullValue: props.nullValue,
				max: props.columns
			}) as PickerModelValue;
		};

		const sync = (value: PickerModelValue, label: any[], data: any[]) => {
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
					columns: props.columns,
					cascader: props.cascader,
					hideEmptyColumns: props.hideEmptyColumns,
					itemStyle: props.itemStyle,
					title: props.title,
					cancelText: props.cancelText,
					confirm: props.confirm,
					okText: props.okText,
					modelValue: currentValue.value.slice(0),
					renderLabel: props.renderLabel,
					onVisibleChange: (v: boolean) => emit('visible-change', v),
					onPickerChange: (v: PickerValue, index: number, row: any) => emit('picker-change', v, index, row),
					onClose: () => emit('close'),
					onOk: (value: PickerModelValue, label: any[], data: any[]) => {
						const modelValue = apply(value);
						emit('ok', modelValue, label, data);
						sync(modelValue, label, data);
					},
					// 不需要确认时，滚轮停下即提交
					onChange: (value: PickerModelValue, label: any[], data: any[]) => {
						// 确定时弹层同样发出 change，由 onOk 处理
						if (props.confirm) return;
						sync(apply(value), label, data);
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
