/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';
import { props as calendarPickerProps } from './calendar-picker-props';
import { MCalendarPickerPortal } from './calendar-picker-core';

const COMPONENT_NAME = 'vcm-calendar-picker';

// 表单里的触发区：MListItem 显示已选日期，点按打开日历弹层
export const MCalendarPicker = defineComponent({
	name: COMPONENT_NAME,
	props: calendarPickerProps,
	emits: [
		'update:modelValue',
		'visible-change',
		'date-click',
		'ok',
		'cancel',
		'change',
		'close'
	],
	setup(props, setupContext) {
		const { slots } = setupContext;
		const { t } = useLocale();
		const currentValue = ref<any>(props.modelValue);

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		const label = computed(() => {
			const value = currentValue.value;
			const placeholder = props.extra ?? t('vc.DatePicker.placeholder');
			const custom = props.formatter?.(value);
			if (custom) return custom;

			const list = (Array.isArray(value) ? value : [value]).filter(item => item || item === 0);
			if (!list.length) return placeholder;

			return list
				.map(item => (item instanceof Date ? item.toLocaleDateString() : item))
				.join(props.type === 'daterange' ? props.separator : ', ');
		});

		const trigger = usePickerTrigger(setupContext, {
			portal: MCalendarPickerPortal,
			accept: (value: any) => (currentValue.value = value),
			forward: ['date-click']
		});

		const handleClick = () => {
			trigger.open({
				modelValue: currentValue.value,
				type: props.type,
				multiple: props.multiple,
				format: props.format,
				nullValue: props.nullValue,
				disabledDate: props.disabledDate,
				yearRange: props.yearRange,
				firstDayOfWeek: props.firstDayOfWeek,
				lunar: props.lunar,
				title: props.title,
				cancelText: props.cancelText,
				okText: props.okText,
				confirm: props.confirm,
				slots: (slots.content || slots.cell) ? { content: slots.content, cell: slots.cell } : undefined
			});
		};

		return () => {
			return (
				<div class="vcm-calendar-picker" onClick={handleClick}>
					{
						slots.default
							? slots.default({ label: label.value, value: currentValue.value })
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										arrow={props.arrow}
										extra={label.value}
									/>
								)
					}
				</div>
			);
		};
	}
});
