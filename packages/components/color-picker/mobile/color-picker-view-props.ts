import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as viewProps } from '../color-picker-view/color-picker-view-props';
import { props as colorPickerProps } from '../color-picker-props';

// 取值行：与桌面端 ColorPicker 同名同义（可输入色值、可清空、清空后的值）
const pickerKeys = [
	'editable',
	'clearable',
	'nullValue'
] as const;

export const props = {
	...viewProps,
	...(pick(colorPickerProps, pickerKeys) as Pick<typeof colorPickerProps, typeof pickerKeys[number]>)
};

export type Props = ExtractPropTypes<typeof props>;
