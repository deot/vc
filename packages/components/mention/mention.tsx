import { defineComponent } from 'vue';
import { props as mentionProps } from './mention-props';
import { useMention, emits } from './use-mention';

const COMPONENT_NAME = 'vc-mention';

export const Mention = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: mentionProps,
	emits: [...emits],
	setup(props, context) {
		return useMention(props, context);
	}
});
