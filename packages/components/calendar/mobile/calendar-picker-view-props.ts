import type { ExtractPropTypes } from 'vue';
import { selectionProps } from '../calendar-props';

// 与 Calendar 的选择相关属性相同；可滚动的月份为 yearRange 内的全部月份
export const props = {
	...selectionProps
};

export type Props = ExtractPropTypes<typeof props>;
