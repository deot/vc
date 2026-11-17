/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as descriptionsProps } from '../descriptions-props';
import { MClipboard } from '../../clipboard/index.m';
import { MFilePreview } from '../../file-preview/index.m';
import { MPopover } from '../../popover/index.m';
import { useDescriptions } from '../use-descriptions';

const COMPONENT_NAME = 'vcm-descriptions';

// 复制提示使用Toast，图片与文件使用移动端预览，标签提示点按打开
export const MDescriptions = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionsProps,
	setup(props, context) {
		return useDescriptions(props, context, { mobile: true, Clipboard: MClipboard, FilePreview: MFilePreview, Popover: MPopover });
	}
});
