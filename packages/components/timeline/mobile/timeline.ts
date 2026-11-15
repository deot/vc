import { defineComponent } from 'vue';
import { props as timelineProps } from '../timeline-props';
import { useTimeline } from '../use-timeline';

const COMPONENT_NAME = 'vcm-timeline';

/**
 * 移动端时间轴：同 Timeline，根节点另有标记类 vcm-timeline，尺寸随 --vc-rem 缩放（750 稿）
 */
export const MTimeline = defineComponent({
	name: COMPONENT_NAME,
	props: timelineProps,
	setup(props, context) {
		return useTimeline(props, context, { mobile: true });
	}
});
