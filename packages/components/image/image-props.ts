import type { ComponentInternalInstance, ExtractPropTypes, PropType } from 'vue';

export type ImageFormatter = (data: { value: string; type: string; instance: ComponentInternalInstance }) => string | void;

export const props = {
	src: String,
	thumbnail: String,
	fit: String,
	lazy: Boolean,
	wrapper: [Object, String],
	previewable: {
		type: Boolean,
		default: true
	},
	formatter: Function as PropType<ImageFormatter>,
};
export type Props = ExtractPropTypes<typeof props>;
