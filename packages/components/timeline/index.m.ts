import { MTimeline } from './mobile/timeline.ts';
import { TimelineItem } from './timeline-item.tsx';
import './style.scss';
import './mobile/style.scss';

// TimelineItem 两端相同：尺寸由 Timeline 根节点上的局部变量决定
export const MTimelineItem = TimelineItem;

export {
	MTimeline
};
