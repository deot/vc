/** @jsxImportSource vue */

import { defineComponent, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { useLocale } from '../../locale';
import { MPickerPopup } from '../../picker/index.m';
import { props as pickerPopupProps } from '../../picker/mobile/picker-popup-props';
import { pickerCoreProps, pickerCoreEmits, usePickerCore } from '../../picker/mobile/use-picker-portal';
import { MCalendarPickerView } from './calendar-picker-view';
import { props as viewProps } from './calendar-picker-view-props';

const COMPONENT_NAME = 'vcm-calendar-picker-core';

const popupKeys = [
	'title',
	'cancelText',
	'okText'
] as const;

export const MCalendarPickerCore = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...(pick(pickerPopupProps, popupKeys) as Pick<typeof pickerPopupProps, typeof popupKeys[number]>),
		...viewProps,
		// 弹层高，「确定」默认放在底部
		confirm: {
			...pickerPopupProps.confirm,
			default: 'bottom'
		},
		...pickerCoreProps
	},
	emits: [...pickerCoreEmits, 'date-click'],
	setup(props, setupContext) {
		const { emit, slots } = setupContext;
		const { t } = useLocale();
		const core = usePickerCore(props, setupContext);
		const currentValue = ref<any>(props.modelValue);

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		const handleOk = () => core.ok(currentValue.value);

		// 不需要确认：单选、区间选完即提交并关闭；多选每次点选提交，弹层保持打开
		const handleViewChange = (v: any) => {
			currentValue.value = v;
			if (props.confirm) return;

			props.multiple && props.type !== 'daterange' ? core.commit(v) : core.ok(v);
		};

		return () => {
			return (
				<MPickerPopup
					{...core.getPopupProps()}
					class="vcm-calendar-picker-popup"
					title={props.title || t('vc.DatePicker.selectDate')}
					cancelText={props.cancelText ?? t('vc.DatePicker.cancelText')}
					okText={props.okText ?? t('vc.DatePicker.okText')}
					confirm={props.confirm}
					onOk={handleOk}
				>
					<MCalendarPickerView
						modelValue={currentValue.value}
						type={props.type}
						multiple={props.multiple}
						format={props.format}
						nullValue={props.nullValue}
						disabledDate={props.disabledDate}
						yearRange={props.yearRange}
						firstDayOfWeek={props.firstDayOfWeek}
						lunar={props.lunar}
						v-slots={{ content: slots.content, cell: slots.cell }}
						// @ts-ignore
						onDateClick={(e: any) => emit('date-click', e)}
						onUpdate:modelValue={handleViewChange}
					/>
				</MPickerPopup>
			);
		};
	}
});

export const MCalendarPickerPortal = new Portal(MCalendarPickerCore, {
	promise: false
});
