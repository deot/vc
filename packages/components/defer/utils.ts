import { getUid } from '@deot/helper-utils';

const FRAME_BUDGET = 5; // 每个时间片的毫秒数，为渲染留出空间

// 单例消息通道——在所有任务中重复使用
const channel = new MessageChannel();
const taskMap = new Map<string, (idleDeadline: IdleDeadline) => void>();
let isMessagePending = false;

const scheduleFlush = () => {
	if (isMessagePending) return;
	isMessagePending = true;
	channel.port2.postMessage(null);
};

channel.port1.onmessage = () => {
	isMessagePending = false;

	const entry = taskMap.entries().next();
	if (entry.done) return;

	const [id, callback] = entry.value;
	taskMap.delete(id);

	const startTime = performance.now();
	const deadline: IdleDeadline = {
		didTimeout: false,
		timeRemaining: () => Math.max(0, FRAME_BUDGET - (performance.now() - startTime))
	};

	callback(deadline);

	// 如果回调被重新安排（或者有其他任务被排队），则继续执行刷新操作。
	if (taskMap.size > 0) {
		scheduleFlush();
	}
};

export const ric = (cb: (idleDeadline: IdleDeadline) => void): string => {
	const id = getUid();
	taskMap.set(id, cb);
	scheduleFlush();
	return id;
};

export const cic = (id: string) => {
	taskMap.delete(id);
};
