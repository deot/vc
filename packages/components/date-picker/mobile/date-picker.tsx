/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { props as datePickerProps } from './date-picker-props';
import { MDatePickerPortal } from './date-picker-core';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';
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
	setup(props, setupContext) {
		const { slots } = setupContext;
		const { t } = useLocale();
		const extra = computed(() => props.extra ?? t('vc.DatePicker.placeholder'));
		const currentValue = ref<any>(props.modelValue);

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

		const trigger = usePickerTrigger(setupContext, {
			portal: MDatePickerPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['picker-change']
		});

		const handleClick = () => {
			trigger.open({
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
				confirm: props.confirm,
				nullValue: props.nullValue,
				modelValue: currentValue.value
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
