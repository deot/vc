import { ref, getCurrentInstance, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { Resize } from '@deot/helper-resize';
import { toRem } from '@deot/vc-shared';

// 探针的宽度（750 稿）：即 100vw（封顶 480px），越宽换算越精确
const PROBE_SIZE = 750;

// 与 --vc-rem 注册的初始值一致（375 宽）：没有 DOM 或量不到时使用
const rem = ref(0.5);
let probe: HTMLElement | undefined;
let count = 0;

const refresh = () => {
	const { width } = probe!.getBoundingClientRect();
	// 量不到（页面不在布局中）时保留上一次的值
	width && (rem.value = width / PROBE_SIZE);
};

const acquire = () => {
	if (count++ || typeof document === 'undefined') return;
	probe = document.createElement('div');
	probe.style.cssText = `position: fixed; top: 0; left: 0; width: ${toRem(PROBE_SIZE)}; height: 0; visibility: hidden; pointer-events: none;`;
	document.body.appendChild(probe);
	refresh();
	Resize.on(probe, refresh);
};

const release = () => {
	if (--count || !probe) return;
	Resize.off(probe, refresh);
	probe.remove();
	probe = undefined;
};

/**
 * 750 稿上 1 个单位当前的 px（即 --vc-rem 的计算值），全局共享、随环境变化
 *
 * 用于需要在 JS 里把 750 稿长度算成 px 的地方（虚拟列表的预估尺寸、列宽等）；只是写进样式时用 toRem 即可。
 * 所有使用者共用 body 下的一个隐藏探针：视口变化、480 封顶、业务注入 --rem 都反映为探针宽度的变化，
 * 不依赖 resize 事件的先后，也不依赖 --vc-rem 是否已注册（`@property`）。
 * 在 setup 中调用时随组件卸载释放，最后一个使用者释放后移除探针；在组件外调用则一直保持监听
 * @returns 只读的 px 值；乘以 750 稿长度即 px
 */
export const useRem = (): Readonly<Ref<number>> => {
	acquire();
	getCurrentInstance() && onBeforeUnmount(release);
	return rem;
};
