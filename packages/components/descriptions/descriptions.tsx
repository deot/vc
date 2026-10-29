/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as descriptionsProps } from './descriptions-props';
import { Clipboard } from '../clipboard';
import { useDescriptions } from './use-descriptions';

const COMPONENT_NAME = 'vc-descriptions';

export const Descriptions = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionsProps,
	setup() {
		return useDescriptions({ Clipboard });
	}
});
