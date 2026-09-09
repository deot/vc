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
	textStyle: {
		type: [String, Object]
	},
	textClass: {
		type: [String, Object]
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
		default: '#456CF6'
	},
	trackColor: {
		type: String,
		default: 'var(--vc-progress-track-color, var(--vc-color-light-deeper))'
	},
	size: {
		type: Number,
		default: 120
	},
	color: {
		type: [Object, String],
		default: () => ({
			normal: 'var(--vc-progress-color-primary, var(--vc-color-primary))',
			success: 'var(--vc-progress-color-success, var(--vc-color-success))',
			error: 'var(--vc-progress-color-error, var(--vc-color-error))'
		})
	}
};
export type Props = ExtractPropTypes<typeof props>;
