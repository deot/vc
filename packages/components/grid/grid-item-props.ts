import type { ExtractPropTypes, PropType } from 'vue';
import type { GridResponsive, GridSpan, GridJustify, GridAlign } from './types';

export const props = {
	/**
	 * 跨越的轨道数，超过轨道数时按整行；auto占满本行剩余
	 */
	span: {
		type: [Number, String, Object] as PropType<GridResponsive<GridSpan>>,
		default: 24
	},
	/**
	 * 左侧空出的轨道数
	 */
	offset: {
		type: [Number, Object] as PropType<GridResponsive<number>>,
		default: 0
	},
	/**
	 * 放在最后并靠右；折叠时始终显示
	 */
	suffix: {
		type: Boolean,
		default: false
	},
	/**
	 * 覆盖Grid的justify / align（justify-self / align-self）
	 */
	justify: String as PropType<GridJustify>,
	align: String as PropType<GridAlign>
};
export type Props = ExtractPropTypes<typeof props>;
