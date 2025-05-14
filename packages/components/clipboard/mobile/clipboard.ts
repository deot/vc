/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { MToast } from '../../toast/index.m';
import { props as clipboardProps } from '../clipboard-props';
import { useClipboard } from '../use-clipboard';

const COMPONENT_NAME = 'vcm-clipboard';

export const MClipboard = defineComponent({
	name: COMPONENT_NAME,
	props: clipboardProps,
	setup() {
		return useClipboard((content: string) => MToast.info({ content }));
	}
});
