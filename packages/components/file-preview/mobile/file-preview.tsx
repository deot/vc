import { defineComponent } from 'vue';
import { props as filePreviewProps } from '../file-preview-props';
import { useFilePreview } from '../use-file-preview';

const COMPONENT_NAME = 'vcm-file-preview';

/**
 * 移动端文件列表：同 FilePreview，根节点另有标记类 vcm-file-preview，尺寸随 --vc-rem 缩放（750 稿）；点开为移动端查看器
 */
export const MFilePreview = defineComponent({
	name: COMPONENT_NAME,
	props: filePreviewProps,
	setup(props, context) {
		return useFilePreview(props, context, { mobile: true });
	}
});
