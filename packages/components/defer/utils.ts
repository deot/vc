import { getUid } from '@deot/helper-utils';

/**
 * 每个时间片的毫秒数：取一帧
 *
 * 实测一次分片往返的固定开销约 6ms（提交 + patch + 浏览器重排），预算必须显著大于它，
 * 否则时间全花在往返上，分片反而比一次性渲染慢几十倍
 */
const FRAME_BUDGET = 16;

// 单例消息通道——在所有任务中重复使用
const channel = new MessageChannel();
const taskMap = new Map<string, (deadline: IdleDeadline) => void>();
let isMessagePending = false;

const scheduleFlush = () => {
	if (isMessagePending) return;
	isMessagePending = true;
	channel.port2.postMessage(null);
};

// 每条消息只执行一个任务，任务之间让出主线程
channel.port1.onmessage = () => {
	isMessagePending = false;

	const entry = taskMap.entries().next();
	if (entry.done) return;

	const [id, callback] = entry.value;
	taskMap.delete(id);

	const startTime = performance.now();
	callback({
		didTimeout: false,
		timeRemaining: () => Math.max(0, FRAME_BUDGET - (performance.now() - startTime))
	});

	// 如果回调被重新安排（或者有其他任务被排队），则继续执行刷新操作。
	if (taskMap.size > 0) {
		scheduleFlush();
	}
};

/**
 * requestIdleCallback 的实现：语义与原生一致，回调拿到的 deadline 用于决定这一片做多少事
 *
 * 默认用 MessageChannel 而不是原生：原生只在浏览器空闲时执行，虚拟列表的测量池等不起；
 * 签名保持一致，需要时可以直接换成原生实现
 * @param cb 任务回调
 * @returns 任务 id，可传给 cIC 取消
 */
export const rIC = (cb: (deadline: IdleDeadline) => void): string => {
	const id = getUid();
	taskMap.set(id, cb);
	scheduleFlush();
	return id;
};

/**
 * 取消尚未执行的任务
 * @param id rIC 返回的任务 id
 */
export const cIC = (id: string) => {
	taskMap.delete(id);
};
