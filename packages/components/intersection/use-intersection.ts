import { h, ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, readonly } from 'vue';
import type { SetupContext } from 'vue';
import { useRem } from '@deot/vc-hooks';
import { getScroller } from '../scroller/utils';
import { IntersectionManager } from './core/manager';
import type { IntersectionChange } from './core/manager';
import type { Props, IntersectionOffset } from './intersection-props';

export type IntersectionChangeEvent = Omit<IntersectionChange, 'entry'> & {
	// 不支持 IntersectionObserver 时为 null
	entry: IntersectionObserverEntry | null;
};

/**
 * offset → rootMargin：数字按平台换算为 px（IntersectionObserver 只认 px / %），字符串原样
 * @param offset ~
 * @param unit 1 个数字单位的 px：桌面端为 1，移动端为 750 稿 1 个单位的 px
 * @returns ~
 */
const toRootMargin = (offset: IntersectionOffset, unit: number) => {
	const values = Array.isArray(offset) ? offset.slice(0, 4) : [offset];
	return values
		.map(value => (typeof value === 'number' ? `${value * unit}px` : value.trim() || '0px'))
		.join(' ') || '0px';
};

/**
 * Intersection / MIntersection 共用的监听与渲染
 * 	- 参照从自身向上最近的滚动容器（含 vc Scroller），没有时为浏览器视口；挂载与 refresh 时查找
 * 	- 同一容器、同一 offset / threshold 的实例共用一个 IntersectionObserver（IntersectionManager）
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MIntersection）：根节点加标记类 vcm-intersection，数字 offset 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useIntersection = (
	props: Props,
	context: SetupContext<['update:modelValue', 'change']>,
	options: { mobile?: boolean } = {}
) => {
	const { slots, emit, expose } = context;
	const name = options.mobile ? 'vc-intersection vcm-intersection' : 'vc-intersection';
	const rem = options.mobile ? useRem() : null;

	const current = shallowRef<HTMLElement>();
	const visible = ref(false);

	const rootMargin = computed(() => toRootMargin(props.offset, rem ? rem.value : 1));
	const threshold = computed(() => Math.min(Math.max(props.threshold || 0, 0), 1));

	// refresh 后的第一次判断：仍可见时也重新发出 change
	let isForced = false;
	// once：已经可见过
	let done = false;
	let off: (() => void) | undefined;

	const unbind = () => {
		off?.();
		off = void 0;
	};

	const update = (e: IntersectionChangeEvent) => {
		const forced = isForced;
		isForced = false;
		if (e.visible === visible.value && !(forced && e.visible)) return;
		if (e.visible !== visible.value) {
			visible.value = e.visible;
			emit('update:modelValue', e.visible);
		}
		emit('change', e);
		if (e.visible && props.once) {
			done = true;
			unbind();
		}
	};

	const bind = () => {
		unbind();
		const el = current.value;
		if (!el || props.disabled || (props.once && done)) return;

		// 不支持时直接视为可见：进入视区才渲染、懒加载的内容照常出来
		if (!IntersectionManager.supported) {
			update({ visible: true, ratio: 1, entry: null });
			return;
		}

		// 从父节点开始找：自身是滚动容器时，参照的仍是外层
		const scroller = getScroller(el.parentElement);
		off = IntersectionManager.observe(el, {
			root: scroller instanceof HTMLElement ? scroller : null,
			rootMargin: rootMargin.value,
			threshold: threshold.value
		}, update);
	};

	/**
	 * 重新查找滚动容器，并把状态当作不可见重新判断：仍可见时再发出一次 change（如内容替换后重新上报曝光）
	 * once 已触发时也会重新开始
	 */
	const refresh = () => {
		isForced = true;
		done = false;
		bind();
	};

	watch(() => [rootMargin.value, threshold.value, props.disabled, props.once], bind);

	onMounted(bind);
	onBeforeUnmount(unbind);

	expose({ refresh, visible: readonly(visible) });

	return () => h(
		props.tag,
		{ ref: current, class: name },
		slots.default?.({ visible: visible.value })
	);
};
