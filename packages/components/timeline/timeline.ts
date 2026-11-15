import { defineComponent } from 'vue';
import { props as timelineProps } from './timeline-props';
import { useTimeline } from './use-timeline';

const COMPONENT_NAME = 'vc-timeline';

export const Timeline = defineComponent({
	name: COMPONENT_NAME,
	props: timelineProps,
	setup(props, context) {
		return useTimeline(props, context);
	}
});
