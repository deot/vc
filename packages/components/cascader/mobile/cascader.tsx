/** @jsxImportSource vue */

import { computed, defineComponent, inject, onBeforeUnmount, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { getPathLabels } from '../utils';
import { props as cascaderProps, coreOmitKeys } from './cascader-props';
import { props as coreProps } from './cascader-core-props';
import { MCascaderPortal } from './cascader-core';

const COMPONENT_NAME = 'vcm-cascader';

// 透传给弹层的属性
const coreKeys = Object.keys(omit(coreProps, coreOmitKeys));

export const MCascader = defineComponent({
	name: COMPONENT_NAME,
	props: cascaderProps,
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

		// 当前值的路径文字
		const labels = computed(() => getPathLabels(currentValue.value, props));

		const formatterValue = computed(() => {
			return (labels.value.length && props.formatter(labels.value))
				|| (props.extra ?? t('vc.Cascader.placeholder'));
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
			portal = MCascaderPortal.popup({
				...pick(props, coreKeys),
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
				<div class="vcm-cascader" onClick={handleClick}>
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
