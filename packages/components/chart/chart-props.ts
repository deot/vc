import type { ExtractPropTypes } from 'vue';

export const props = {
	options: Object,
	pluginOptions: Object,
	theme: [String, Object],
	group: String,
	autoResize: Boolean,
	watchShallow: Boolean,
	manualUpdate: Boolean
};
export type Props = ExtractPropTypes<typeof props>;
