import './components/style';

document.body.style.fontFamily = (
	`Microsoft YaHei, 微软雅黑, Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Arial, sans-serif`
);

(document.body.querySelector('#app') as HTMLElement).style.backgroundColor = 'var(--vc-background-color-lightest)';

// 设置 viewport 的内容
const metaViewport = document.querySelector('meta[name="viewport"]')!;
metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no');

// 右上角的调试按钮，自上而下排列
const createButton = (top: number) => {
	const button = document.createElement('button');
	button.style.position = 'fixed';
	button.style.top = `${top}px`;
	button.style.right = '0';
	button.style.cursor = 'pointer';
	button.style.zIndex = '999';
	document.body.appendChild(button);
	return button;
};

// 设置主题
const el = createButton(0);

el.addEventListener('click', () => {
	const key = 'data-vc-theme';
	let v = document.body.getAttribute(key);
	v = !v || v === 'dark' ? 'light' : 'dark';

	document.body.setAttribute(key, v);
	el.innerHTML = `theme: ${v}`;
});
el.dispatchEvent(new Event('click'));

// 设置主题值
const tEl = createButton(22);

tEl.addEventListener('click', () => {
	const style = {
		background: `var(--vc-background-color)`,
		color: `var(--vc-foreground-color)`,
	};

	const key = 'data-vc-value';
	let v = document.body.getAttribute(key);
	v = !v || v === 'unset' ? 'set' : 'unset';

	document.body.setAttribute(key, v);
	tEl.innerHTML = `vars: ${v}`;

	if (v === 'set') {
		document.body.style.background = style.background;
		document.body.style.color = style.color;
	} else {
		document.body.style.background = '';
		document.body.style.color = '';
	}
});
tEl.dispatchEvent(new Event('click'));

// 性能读数（Chrome）：最长任务（点击清零）与 JS 堆，用于观察 demo 中的卡顿与内存
// 默认不开启，避免给所有 demo 带来常驻的观察与每秒刷新；需要的 demo 调用 window.$perf.observe()，卸载时 disconnect()
const pEl = createButton(44);
pEl.title = '最长任务（点击清零）/ JS 堆';
pEl.style.display = 'none';

let longTask = 0;

const renderPerf = () => {
	const memory = (performance as any).memory;
	const heap = memory ? `${Math.round(memory.usedJSHeapSize / 1048576)}MB` : '-';
	const text = `longtask: ${longTask}ms · heap: ${heap}`;
	// 只在文字变化时写入：数字不变时不触发样式计算与重绘
	pEl.textContent !== text && (pEl.textContent = text);
};

// 观察中时为停止函数
let stop: (() => void) | null = null;

const perf = {
	// 开始观察：长任务与每秒刷新的 JS 堆，并显示按钮
	observe() {
		if (stop) return;
		let observer: PerformanceObserver | undefined;
		try {
			observer = new PerformanceObserver((list) => {
				list.getEntries().forEach((entry) => {
					longTask = Math.max(longTask, Math.round(entry.duration));
				});
				renderPerf();
			});
			observer.observe({ type: 'longtask' });
		} catch {
			// 不支持 longtask 的浏览器只显示 JS 堆
		}
		const timer = setInterval(renderPerf, 1000);
		pEl.style.display = '';
		stop = () => {
			observer?.disconnect();
			clearInterval(timer);
			pEl.style.display = 'none';
			stop = null;
		};
		perf.reset();
	},
	disconnect() {
		stop?.();
	},
	// 清零最长任务：点击按钮，或在 demo 里调用（如切页前）
	reset() {
		longTask = 0;
		renderPerf();
	}
};

pEl.addEventListener('click', perf.reset);

declare global {
	interface Window {
		$perf: typeof perf;
	}
}
window.$perf = perf;
