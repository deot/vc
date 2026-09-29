import type { ExtractPropTypes, PropType, VNodeChild } from 'vue';

export const STEP_STATUSES = ['default', 'pending', 'success', 'error'] as const;

export type StepStatus = typeof STEP_STATUSES[number];

export type StepsRenderDot = (options: {
	index: number;
	status: StepStatus;
	title: any;
	description: any;
	dot: VNodeChild;
}) => VNodeChild;

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	/**
	 * 当前步数，从1开始
	 */
	modelValue: {
		type: Number,
		default: 1
	},
	vertical: {
		type: Boolean,
		default: false
	},
	/**
	 * 标题与描述相对节点的位置
	 * 纵向时只支持right/left（bottom视为right，top视为left）
	 * dot横向时只支持bottom/top（right视为bottom，left视为top）
	 */
	labelPosition: {
		type: String as PropType<'right' | 'bottom' | 'left' | 'top'>,
		default: 'right',
		validator(val: string): boolean {
			return ['right', 'bottom', 'left', 'top'].indexOf(val) !== -1;
		}
	},
	/**
	 * arrow/navigation只支持横向
	 */
	type: {
		type: String as PropType<'default' | 'dot' | 'arrow' | 'navigation'>,
		default: 'default',
		validator(val: string): boolean {
			return ['default', 'dot', 'arrow', 'navigation'].indexOf(val) !== -1;
		}
	},
	/**
	 * 当前这一步的状态
	 */
	status: {
		type: String as PropType<StepStatus>,
		default: 'pending',
		validator(val: StepStatus): boolean {
			return STEP_STATUSES.indexOf(val) !== -1;
		}
	},
	lineless: {
		type: Boolean,
		default: false
	},
	/**
	 * 点击切换步数
	 */
	clickable: {
		type: Boolean,
		default: false
	},
	/**
	 * 自定义节点，arrow下不生效
	 */
	renderDot: Function as PropType<StepsRenderDot>
};
export type Props = ExtractPropTypes<typeof props>;
