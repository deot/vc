import { props as noticeViewProps } from '../notice-view-props';

// 移动端：通栏贴顶，top 为 750 稿长度（默认 0；放在导航栏下方时传 88）
export const props = {
	...noticeViewProps,
	top: {
		...noticeViewProps.top,
		default: 0
	}
};
