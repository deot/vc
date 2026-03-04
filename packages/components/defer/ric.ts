import { raf, caf, getUid } from '@deot/helper-utils';

const idMap: Record<string, number> = {};

export const ric = (cb: (idleDeadline: IdleDeadline) => void, options?: { timeout: number }) => {
	const channel = new MessageChannel();
	const port1 = channel.port1;
	const port2 = channel.port2;
	let deadlineTime: number;
	let frameDeadlineTime: number;
	let callback: (idleDeadline: IdleDeadline) => void;

	const id = getUid();

	port2.onmessage = () => {
		const frameTimeRemaining = () => frameDeadlineTime - performance.now();
		const didTimeout = performance.now() >= deadlineTime;

		if (didTimeout || frameTimeRemaining() > 0) {
			const idleDeadline = {
				timeRemaining: frameTimeRemaining,
				didTimeout
			};
			callback && callback(idleDeadline);
		} else {
			idMap[id] = raf((timeStamp) => {
				frameDeadlineTime = timeStamp + 16.7;
				port1.postMessage(null);
			});
		}
	};

	idMap[id] = raf((timeStamp) => {
		frameDeadlineTime = timeStamp + 16.7; // 当前帧截止时间，按照 60fps 计算
		deadlineTime = options?.timeout ? timeStamp + options.timeout : Infinity; // 超时时间
		callback = cb;
		port1.postMessage(null);
	});

	return id;
};

export const cid = (id: string) => {
	if (!idMap[id]) return;
	caf(idMap[id]);
	delete idMap[id];
};
