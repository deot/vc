import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as CustomerProps } from '../customer/customer-props';
import { STEP_STATUSES } from './steps-props';
import type { StepStatus } from './steps-props';

export const props = {
	title: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	description: {
		type: [String, Function] as PropType<string | CustomerProps['render']>,
		default: ''
	},
	/**
	 * 优先于Steps推导的状态
	 */
	status: {
		type: String as PropType<StepStatus>,
		validator(val: StepStatus): boolean {
			return STEP_STATUSES.indexOf(val) !== -1;
		}
	},
	disabled: {
		type: Boolean,
		default: false
	},
	/**
	 * 内部使用：由Steps注入的步数（从1开始）
	 */
	index: {
		type: Number,
		default: 1
	}
};
export type Props = ExtractPropTypes<typeof props>;
