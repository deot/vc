export const getElement = (element: any) => {
	if (!element) return null;
	const result = typeof element === 'function' ? element() : typeof element === 'string' ? document.querySelector(element) : element;
	return result instanceof HTMLElement && result.isConnected ? result : null;
};

export const waitForElement = (get: () => HTMLElement | null, duration: number, signal: AbortSignal) => {
	return new Promise<HTMLElement | null>((resolve) => {
		const observer = new MutationObserver(() => check());
		const done = (element: HTMLElement | null) => {
			clearTimeout(timer);
			clearInterval(interval);
			observer.disconnect();
			signal.removeEventListener('abort', abort);
			resolve(element);
		};
		const abort = () => done(null);
		const check = () => {
			const element = get();
			element && done(element);
		};
		if (signal.aborted) return resolve(null);
		signal.addEventListener('abort', abort, { once: true });
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true
		});
		const timer = setTimeout(() => done(null), duration);
		const interval = setInterval(check, 50);
		check();
	});
};

export const getStagePath = (width: number, height: number, rect: DOMRect | null, radius: number) => {
	const outer = `M0,0H${width}V${height}H0Z`;
	if (!rect) return outer;
	const { x, y, width: w, height: h } = rect;
	const r = Math.max(0, Math.min(radius, w / 2, h / 2));
	return `${outer}M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}`
		+ `V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}`
		+ `H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;
};

/**
 * 记录当前焦点，返回恢复函数；原焦点已移除时执行 fallback。
 * @param fallback 原焦点不可用时的回退
 * @returns 恢复焦点的函数
 */
export const saveFocus = (fallback?: () => void) => {
	const element = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	return () => {
		if (element?.isConnected) element.focus({ preventScroll: true });
		else fallback?.();
	};
};
