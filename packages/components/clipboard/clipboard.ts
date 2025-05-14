/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Message } from '../message';
import { props as clipboardProps } from './clipboard-props';
import { useClipboard } from './use-clipboard';

const COMPONENT_NAME = 'vc-clipboard';

export const Clipboard = defineComponent({
	name: COMPONENT_NAME,
	props: clipboardProps,
	setup() {
		return useClipboard((content: string) => Message.success({ content }));
	}
});
