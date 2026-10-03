import type { ExtractPropTypes, PropType } from 'vue';

type IconSizeItem = number | [number, number?];
// 12 / [外层, 里层?]，每层为 数值 或 [宽, 高?]
export type IconSize = number | [IconSizeItem, IconSizeItem?];

export const props = {
	type: String,
	inherit: {
		type: Boolean,
		default: false
	},
	color: String,
	// 无值时跟随外层的font-size
	size: [Number, Array] as PropType<IconSize>
};
export type Props = ExtractPropTypes<typeof props>;
