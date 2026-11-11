import { defineComponent } from 'vue';
import { props as filePreviewProps } from './file-preview-props';
import { useFilePreview } from './use-file-preview';

const COMPONENT_NAME = 'vc-file-preview';

export const FilePreview = defineComponent({
	name: COMPONENT_NAME,
	props: filePreviewProps,
	setup(props, context) {
		return useFilePreview(props, context);
	}
});
