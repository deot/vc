import { defineComponent } from 'vue';
import { props as progressProps } from './progress-props';
import { useProgress } from './use-progress';

const COMPONENT_NAME = 'vc-progress';

export const Progress = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props, context) {
		return useProgress(props, context);
	}
});
