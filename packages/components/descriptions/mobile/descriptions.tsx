/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as descriptionsProps } from '../descriptions-props';
import { MClipboard } from '../../clipboard/index.m';
import { useDescriptions } from '../use-descriptions';

const COMPONENT_NAME = 'vcm-descriptions';

// 复制提示使用Toast
export const MDescriptions = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionsProps,
	setup() {
		return useDescriptions({ Clipboard: MClipboard });
	}
});
