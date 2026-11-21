import { defineComponent } from 'vue';
import { props as noticeViewProps } from './notice-view-props';
import { useNoticeView } from './use-notice-view';

const COMPONENT_NAME = 'vc-notice';

export const NoticeView = defineComponent({
	name: COMPONENT_NAME,
	props: noticeViewProps,
	emits: ['portal-fulfilled', 'close', 'before-close'],
	setup(props, context) {
		return useNoticeView(props, context);
	}
});
