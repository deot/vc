import { defineComponent } from 'vue';
import { props as tagProps } from './tag-props';
import { useTag } from './use-tag';

const COMPONENT_NAME = 'vc-tag';

export const Tag = defineComponent({
	name: COMPONENT_NAME,
	props: tagProps,
	emits: ['close', 'change'],
	setup(props, context) {
		return useTag(props, context);
	}
});
