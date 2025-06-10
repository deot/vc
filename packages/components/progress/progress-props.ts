import type { ExtractPropTypes } from 'vue';

export const props = {
	type: {
		type: String,
		validator(val: string) {
			return ['line', 'circle'].includes(val);
		},
		default: 'line'
	},
	percent: {
		type: [Number, String],
		default: 0
	},
	status: {
		validator(val: string) {
			return ['normal', 'error', 'success'].includes(val);
		},
		default: 'normal'
	},
	showText: {
		type: Boolean,
		default: true
	},
	animated: {
		type: Boolean,
		default: false
	},
	strokeWidth: {
		type: Number,
		default: 6
	},
	strokeColor: {
		type: String,
		default: '#2d8cf0'
	},
	trackColor: {
		type: String,
		default: '#eaeef2'
	},
	size: {
		type: Number,
		default: 120
	},
	color: {
		type: [Object, String],
		default: () => ({
			normal: '#2B72FD',
			success: '#52c41a',
			error: '#f5222d'
		})
	}
};
export type Props = ExtractPropTypes<typeof props>;
