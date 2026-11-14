/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { props as selectProps, coreOmitKeys } from './select-props';
import { props as coreProps } from './select-core-props';
import { MSelectPortal } from './select-core';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';
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
	setup(props, context) {
		const { slots } = context;
		const { t } = useLocale();
		const currentValue = ref<any>(props.modelValue);
		const trigger = usePickerTrigger(context, {
			portal: MSelectPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['select', 'clear']
		});

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

		const handleClick = () => {
			if (props.disabled) return;
			trigger.open({
				...pick(props, coreKeys),
				// 选项的 label 插槽在弹层中按 renderLabel 渲染
				renderLabel: slots.label || props.renderLabel,
				modelValue: currentValue.value
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
