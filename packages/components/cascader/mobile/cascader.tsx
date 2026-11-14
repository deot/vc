/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { getPathLabels } from '../utils';
import { props as cascaderProps, coreOmitKeys } from './cascader-props';
import { props as coreProps } from './cascader-core-props';
import { MCascaderPortal } from './cascader-core';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';

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
	setup(props, context) {
		const { slots } = context;
		const { t } = useLocale();
		const currentValue = ref<any>(props.modelValue);
		const trigger = usePickerTrigger(context, {
			portal: MCascaderPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['select', 'clear']
		});

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

		const handleClick = () => {
			trigger.open({
				...pick(props, coreKeys),
				modelValue: currentValue.value
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
