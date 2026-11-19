import { defineComponent } from 'vue';
import { props as imageCropProps } from '../image-crop-props';
import { emits, useImageCrop } from '../use-image-crop';

const COMPONENT_NAME = 'vcm-image-crop';

/**
 * 移动端图片裁剪：同 ImageCrop，根节点另有标记类 vcm-image-crop；单指平移、双指缩放（不监听滚轮），尺寸为 750 稿
 */
export const MImageCrop = defineComponent({
	name: COMPONENT_NAME,
	props: imageCropProps,
	emits,
	setup(props, context) {
		return useImageCrop(props, context, { mobile: true });
	}
});
