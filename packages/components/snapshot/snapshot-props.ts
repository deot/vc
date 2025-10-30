import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	// useCORS
	crossOrigin: {
		type: String,
		// ''. 'anonymous', 'use-credentials'
		default: 'anonymous',
		validator: v => /^(|anonymous|use-credentials)$/.test(v),
	},
	source: Function,
	download: Function,
	// 传递给snap-dom的配置项
	options: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
