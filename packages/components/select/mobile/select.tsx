/** @jsxImportSource vue */

import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { props as selectProps, coreOmitKeys } from './select-props';
import { props as coreProps } from './select-core-props';
import { MSelectPortal } from './select-core';
import { flattenData, getSelectLabels, toCurrentValue } from '../utils';

const COMPONENT_NAME = 'vcm-select';

// 透传给弹层的属性
const coreKeys = Object.keys(omit(coreProps, coreOmitKeys));

export const MSelect = defineComponent({
	name: COMPONENT_NAME,
	props: selectProps,
	emits: [
		'update:modelValue',
		'visible-change',
		'select',
		'clear',
		'ok',
		'cancel',
		'change',
		'close'
	],
	setup(props, { emit, slots }) {
		const { t } = useLocale();
		const formItem = inject<any>('vc-form-item', {});
		const currentValue = ref<any>(props.modelValue);
		// 打开的弹层（Portal 实例）
		let portal: any;

		// 当前值的文字
		// 铺平的选项（含分组内的），用于查找已选项的文字
		const source = computed(() => flattenData(props.data, { parent: true, cascader: true }));
		const labels = computed(() => getSelectLabels(toCurrentValue(currentValue.value, props), source.value));

		const formatterValue = computed(() => {
			return (labels.value.length && props.formatter(labels.value, currentValue.value))
				|| (props.extra ?? t('vc.Select.placeholder'));
		});

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		onBeforeUnmount(() => {
			portal?.destroy?.();
		});

		const handleClick = () => {
			if (props.disabled) return;
			portal = MSelectPortal.popup({
				...pick(props, coreKeys),
				// 选项的 label 插槽在弹层中按 renderLabel 渲染
				renderLabel: slots.label || props.renderLabel,
				modelValue: currentValue.value,
				onVisibleChange: (v: boolean) => emit('visible-change', v),
				onSelect: (payload: any) => emit('select', payload),
				onClear: () => emit('clear'),
				onClose: () => emit('close'),
				onOk: (value: any, $labels: string[]) => {
					currentValue.value = value;
					emit('ok', value, $labels);
					emit('update:modelValue', value, $labels);
					emit('change', value, $labels);
					formItem?.change?.(value);
				},
				onCancel: () => emit('cancel')
			});
		};

		return () => {
			return (
				<div class={['vcm-select', { 'is-disabled': props.disabled }]} onClick={handleClick}>
					{
						slots.default
							? slots.default({
									label: labels.value,
									value: currentValue.value
								})
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										arrow={props.disabled ? false : props.arrow}
										extra={formatterValue.value}
									/>
								)
					}
				</div>
			);
		};
	}
});
