import { defineComponent } from 'vue';
import { props as progressProps } from './progress-props';
import { useProgress } from '../use-progress';

const COMPONENT_NAME = 'vcm-progress';

/**
 * 移动端进度条：同 Progress，根节点另有标记类 vcm-progress；数字 strokeWidth（线形）、size 为 750 稿长度，随 --vc-rem 缩放
 */
export const MProgress = defineComponent({
	name: COMPONENT_NAME,
	props: progressProps,
	setup(props, context) {
		return useProgress(props, context, { mobile: true });
	}
});
