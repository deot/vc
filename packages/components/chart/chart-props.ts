import type { ExtractPropTypes } from 'vue';

export const props = {
	options: Object,
	pluginOptions: Object,
	theme: [String, Object],
	group: String,
	resize: {
		type: [Boolean, Number],
		default: 100
	},
	watchShallow: Boolean,
	manualUpdate: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
