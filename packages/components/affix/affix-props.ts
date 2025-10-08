import type { ExtractPropTypes } from 'vue';

export const props = {
	zIndex: {
		type: [Number, String],
		default: 1
	},
	placement: {
		type: String,
		default: 'top'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	fixed: {
		type: Boolean,
		default: true
	},
	offset: {
		type: Number,
		default: 0
	},
	// -> 固钉始终保持在容器内， 超过范围则隐藏(请注意容器避免出现滚动条)
	to: {
		type: String
	}
};
export type Props = ExtractPropTypes<typeof props>;
