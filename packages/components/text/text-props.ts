import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	value: {
		type: String,
		default: ''
	},
	line: {
		type: Number,
		default: 0
	},
	// TODO: 是否改为tail-indent来表示尾部缩进
	indent: {
		type: Number,
		default: 0
	},
	resize: {
		type: [Boolean, Number],
		default: 100
	},
	suffix: {
		type: String,
		default: '...'
	},
	placement: {
		type: String,
		default: 'top'
	},
	portalClass: [Object, String, Array],
	portalStyle: [Object, String, Array],
	renderRow: {
		type: Function,
		default: (props$: any) => {
			return props$.value;
		}
	},
	theme: {
		type: String,
		default: 'dark'
	}
};
export type Props = ExtractPropTypes<typeof props>;
