import type { ExtractPropTypes, PropType } from 'vue';
import type {
	ImageEnhancer,
	ImageProcessorOptions,
	ImageProcessorOutputSize,
	ImageProcessorSource
} from './image-processor';

export const props = {
	src: {
		type: null as unknown as PropType<ImageProcessorSource>,
		default: undefined
	},
	outputSize: {
		type: [Number, Array] as PropType<ImageProcessorOutputSize>,
		default: 100
	},
	enhancer: {
		type: [String, Function] as PropType<'cutout' | 'gray' | ImageEnhancer>,
		default: undefined
	},
	options: {
		type: Object as PropType<ImageProcessorOptions>,
		default: () => ({})
	},
	crossOrigin: {
		type: String as PropType<'' | 'anonymous' | 'use-credentials'>,
		default: 'anonymous'
	}
};
export type Props = ExtractPropTypes<typeof props>;
