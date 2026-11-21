import { defineComponent } from 'vue';
import { props as noticeViewProps } from './notice-view-props';
import { useNoticeView } from '../use-notice-view';

const COMPONENT_NAME = 'vcm-notice';

/**
 * 移动端通知：同 Notice，根节点另有标记类 vcm-notice；顶部全宽通栏（fixed，不推动页面），从上方滑入，可上滑关闭
 * 状态通知为实底白字；尺寸随 --vc-rem 缩放（750 稿），top 为 750 稿长度（默认 0）
 */
export const MNoticeView = defineComponent({
	name: COMPONENT_NAME,
	props: noticeViewProps,
	emits: ['portal-fulfilled', 'close', 'before-close'],
	setup(props, context) {
		return useNoticeView(props, context, { mobile: true });
	}
});
