import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	vertical: {
		type: Boolean,
		default: true
	},
	/**
	 * 轴线位置，纵向：start为左，end为右；横向：start为上，end为下
	 */
	align: {
		type: String as PropType<'start' | 'center' | 'end'>,
		default: 'start',
		validator(val: string): boolean {
			return ['start', 'center', 'end'].indexOf(val) !== -1;
		}
	},
	/**
	 * 交替展示，轴线强制居中（忽略align）
	 */
	alternate: {
		type: Boolean,
		default: false
	},
	/**
	 * 标签位于轴线另一侧
	 */
	opposite: {
		type: Boolean,
		default: false
	},
	inverted: {
		type: Boolean,
		default: false
	},
	/**
	 * 幽灵节点
	 */
	showPending: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
