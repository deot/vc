import { ref, getCurrentInstance, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Resize } from '@deot/helper-resize';
import { toRem } from '@deot/vc-shared';

// 探针的宽度（750 稿）：即 100vw（封顶 480px），越宽换算越精确
const PROBE_SIZE = 750;

// 与 --vc-rem 注册的初始值一致（375 宽）：没有 DOM 或量不到时使用
const INITIAL = 0.5;

interface Entry {
	probe: HTMLElement;
	rem: Ref<number>;
	refresh: () => void;
	count: number;
}

// 每个挂载点一个探针：同一挂载点的使用者共用读数
const entries = new Map<HTMLElement, Entry>();

// 没有 DOM（SSR）时的读数
const fallback = ref(INITIAL);

const resolveHost = (element?: HTMLElement | string): HTMLElement => {
	if (element && typeof element !== 'string') return element;
	return (element && document.querySelector<HTMLElement>(element)) || document.body;
};

const acquire = (host: HTMLElement): Entry => {
	let entry = entries.get(host);
	if (entry) {
		entry.count++;
		return entry;
	}

	const probe = document.createElement('div');
	probe.style.cssText = `position: fixed; top: 0; left: 0; width: ${toRem(PROBE_SIZE)}; height: 0; visibility: hidden; pointer-events: none;`;
	const rem = ref(INITIAL);
	const refresh = () => {
		const { width } = probe.getBoundingClientRect();
		// 量不到（页面不在布局中）时保留上一次的值
		width && (rem.value = width / PROBE_SIZE);
	};
	entry = { probe, rem, refresh, count: 1 };
	entries.set(host, entry);

	host.appendChild(probe);
	refresh();
	Resize.on(probe, refresh);
	return entry;
};

const release = (host: HTMLElement) => {
	const entry = entries.get(host);
	if (!entry || --entry.count) return;
	Resize.off(entry.probe, entry.refresh);
	entry.probe.remove();
	entries.delete(host);
};

export interface UseRemOptions {
	/**
	 * 探针的挂载点（元素或选择器），默认 body；读数取该处继承到的 --vc-rem。
	 * 与 VcInstance.options.Portal.element 同义：组件传入弹层挂载点，局部改写了 --vc-rem 的区域（如文档的移动端预览）也能量对
	 */
	element?: HTMLElement | string;
}

/**
 * 750 稿上 1 个单位当前的 px（即 --vc-rem 的计算值），按挂载点共享、随环境变化
 *
 * 用于需要在 JS 里把 750 稿长度算成 px 的地方（虚拟列表的预估尺寸、列宽等）；只是写进样式时用 toRem 即可。
 * 同一挂载点的使用者共用其下的一个隐藏探针：视口变化、480 封顶、业务注入 --rem 都反映为探针宽度的变化，
 * 不依赖 resize 事件的先后，也不依赖 --vc-rem 是否已注册（`@property`）。
 * 在 setup 中调用时随组件卸载释放，挂载点的最后一个使用者释放后移除探针；在组件外调用则一直保持监听
 * @param options ~
 * @param options.element 探针的挂载点，默认 body
 * @returns 只读的 px 值；乘以 750 稿长度即 px
 */
export const useRem = (options: UseRemOptions = {}): Readonly<Ref<number>> => {
	if (typeof document === 'undefined') return fallback;

	const host = resolveHost(options.element);
	const { rem } = acquire(host);
	getCurrentInstance() && onBeforeUnmount(() => release(host));
	return rem;
};
