import { ref, shallowRef, watch, nextTick, onBeforeUnmount } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { Resize } from '@deot/helper-resize';
import { ScrollerManager } from '../scroller/manager';
import { getViewport } from '../popover/use-pos';

const RECT_KEYS = ['x', 'y', 'width', 'height'] as const;
const isSameRect = (a: DOMRect | null, b: DOMRect | null) => {
	return a === b || (!!a && !!b && RECT_KEYS.every(key => a[key] === b[key]));
};

export const usePosition = (
	isActive: Ref<boolean>,
	element: Ref<HTMLElement | null>,
	options: ComputedRef<any>,
	refreshElement: () => Promise<void>,
	onLayout: () => void
) => {
	const root = shallowRef<HTMLElement>();
	// 气泡（Popover）的触发节点：与高亮区（目标 + stagePadding）重合，位置由 update 直接写入，不参与渲染
	const anchor = document.createElement('div');
	anchor.className = 'vc-tour__anchor';
	// 根节点 ref 的赋值早于子组件的 onMounted：气泡挂载时锚点已在根节点内，首次渲染即可挂载气泡
	watch(root, el => el?.appendChild(anchor), { flush: 'sync' });
	const stage = shallowRef<DOMRect | null>(null);
	const targetStage = shallowRef<DOMRect | null>(null);
	const size = ref({
		width: 0,
		height: 0
	});
	const layer = ref(1002);
	let frameId = 0;
	let animationId = 0;
	let destination: DOMRect | null = null;
	let revision = 0;
	// 层级只受 DOM 结构与样式影响：激活、切换目标、窗口尺寸或外部 DOM 变化后才重新计算，滚动时不必计算
	let isLayerDirty = true;
	let detach = () => {};

	const update = (animate = false) => {
		if (!isActive.value || !root.value) return;
		const viewport = getViewport();
		const bounds = root.value.getBoundingClientRect();
		const x = bounds.x;
		const y = bounds.y;
		const width = bounds.width || viewport.right;
		const height = bounds.height || viewport.bottom;
		if (size.value.width !== width || size.value.height !== height) {
			size.value = {
				width,
				height
			};
		}
		// 传入 zIndex 时不使用计算出的层级
		if (isLayerDirty && options.value.zIndex == null) {
			isLayerDirty = false;
			let zIndex = 1002;
			const layers = [element.value, ...document.querySelectorAll<HTMLElement>('.vc-modal, .vc-drawer')];
			for (let parent of layers) {
				for (; parent; parent = parent.parentElement) {
					zIndex = Math.max(zIndex, (parseInt(getComputedStyle(parent).zIndex) || 0) + 2);
				}
			}
			layer.value = zIndex;
		}
		let rect: DOMRect | null = null;
		if (element.value?.isConnected) {
			const target = element.value.getBoundingClientRect();
			const padding = options.value.stagePadding;
			const [px, py] = Array.isArray(padding) ? padding : [padding, padding];
			const left = Math.max(0, Math.min(width, target.left - px - x));
			const top = Math.max(0, Math.min(height, target.top - py - y));
			const right = Math.max(left, Math.min(width, target.right + px - x));
			const bottom = Math.max(top, Math.min(height, target.bottom + py - y));
			rect = new DOMRect(left, top, right - left, bottom - top);
		}
		const isChanged = !isSameRect(targetStage.value, rect);
		if (isChanged) targetStage.value = rect;
		const isMoving = !animate && options.value.animated && animationId && rect && isSameRect(rect, destination);
		if (!isMoving) cancelAnimationFrame(animationId);
		// 起点与终点相同时（如外部 DOM 变化后重新定位）不重新播放高亮动画
		if (animate && rect && stage.value && !isSameRect(stage.value, rect) && options.value.animated && options.value.duration > 0) {
			const start = stage.value;
			const end = rect;
			destination = rect;
			const time = performance.now();
			const tick = (now: number) => {
				const progress = Math.min((now - time) / options.value.duration, 1);
				const eased = 1 - (1 - progress) ** 3;
				const values = RECT_KEYS.map(key => start[key] + (end[key] - start[key]) * eased);
				stage.value = new DOMRect(values[0], values[1], values[2], values[3]);
				animationId = progress < 1 ? requestAnimationFrame(tick) : 0;
			};
			animationId = requestAnimationFrame(tick);
		} else if (!isMoving) {
			animationId = 0;
			destination = rect;
			if (!isSameRect(stage.value, rect)) stage.value = rect;
		}
		// 锚点直接写入最终位置（不随高亮动画），与镂空在同一帧更新，再通知气泡重新定位
		if (isChanged && rect) {
			Object.assign(anchor.style, {
				left: `${rect.x}px`,
				top: `${rect.y}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`
			});
		}
		onLayout();
	};

	const schedule = () => {
		cancelAnimationFrame(frameId);
		frameId = requestAnimationFrame(() => update());
	};
	const scheduleLayer = () => {
		isLayerDirty = true;
		schedule();
	};

	watch(
		[() => isActive.value, () => element.value],
		async () => {
			const token = ++revision;
			detach();
			detach = () => {};
			isLayerDirty = true;
			if (!isActive.value) {
				cancelAnimationFrame(frameId);
				cancelAnimationFrame(animationId);
				animationId = 0;
				stage.value = null;
				targetStage.value = null;
				return;
			}
			await nextTick();
			if (!isActive.value || !root.value || token !== revision) return;
			const target = element.value;
			const subscription = ScrollerManager.subscribe(target, schedule, { window: true });
			target && Resize.on(target, schedule);
			window.addEventListener('resize', scheduleLayer);
			const observer = new MutationObserver((mutations) => {
				// 忽略卡片、气泡定位、蒙层动画等自身变更，避免观察与更新互相触发。
				if (mutations.every(mutation => root.value?.contains(mutation.target))) return;
				isLayerDirty = true;
				const isDynamic = typeof options.value.element === 'string' || typeof options.value.element === 'function';
				if (isDynamic || (options.value.element && !target?.isConnected)) {
					void refreshElement();
				} else {
					schedule();
				}
			});
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true
			});
			detach = () => {
				subscription.off();
				target && Resize.off(target, schedule);
				window.removeEventListener('resize', scheduleLayer);
				observer.disconnect();
			};
			// 首次定位由 locate（打开、切步、刷新）完成
		},
		{ flush: 'post' }
	);

	watch(
		() => options.value,
		() => schedule(),
		{ deep: true }
	);

	onBeforeUnmount(() => {
		revision++;
		detach();
		cancelAnimationFrame(frameId);
		cancelAnimationFrame(animationId);
	});

	return {
		root,
		anchor,
		stage,
		targetStage,
		size,
		layer,
		update
	};
};
