import { defineComponent } from 'vue';
import { props as imageCropProps } from './image-crop-props';
import { emits, useImageCrop } from './use-image-crop';

const COMPONENT_NAME = 'vc-image-crop';

export const ImageCrop = defineComponent({
	name: COMPONENT_NAME,
	props: imageCropProps,
	emits,
	setup(props, context) {
		return useImageCrop(props, context);
	}
});
