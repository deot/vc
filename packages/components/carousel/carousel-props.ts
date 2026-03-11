import type { ExtractPropTypes } from 'vue';

export const props = {
	t: {
		type: Number,
		default: 3000
	},
	card: Boolean,
	gutter: {
		type: Number,
		default: 0
	},
	height: [String, Number],
	initialIndex: {
		type: Number,
		default: 0
	},
	trigger: {
		type: String,
		default: 'hover'
	},
	autoplay: {
		type: Boolean,
		default: true
	},
	dots: {
		type: [String, Boolean],
		default: 'bottom' // bottom/outside | false
	},
	arrow: {
		type: [String, Boolean],
		default: 'hover' // hover/always | false
	},
	loop: {
		type: Boolean,
		default: true
	},
	vertical: {
		type: Boolean,
		default: false
	},
	draggable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
