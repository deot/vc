/** @jsxImportSource vue */

import { ref, shallowRef, watch, nextTick, onBeforeUnmount } from 'vue';
import type { SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import { useGesture, useRem } from '@deot/vc-hooks';
import { Icon } from '../icon';
import { useCarrierArea, getCarrierArea } from '../scroller/core/carrier-area';
import type { Props, FloatButtonAxis, FloatButtonOffset } from './float-button-props';
import { resolvePortalElement } from '../portal/utils';

const SHARED = { shared: true };
// 吸边、方向键移动的过渡时长（ms），与样式中的 transition 一致
const SNAP_DURATION = 300;
// 方向键每次移动的距离（px），按住 Shift 时
const KEY_STEP = 8;
const KEY_STEP_LARGE = 40;
const KEYS: Record<string, [FloatButtonAxis, 1 | -1]> = {
	ArrowLeft: ['x', -1],
	ArrowRight: ['x', 1],
	ArrowUp: ['y', -1],
	ArrowDown: ['y', 1]
};

// 贴住的边：start 为左 / 上，end 为右 / 下
type Side = 'start' | 'end' | null;
// 某个方向上可停留的范围 [最小, 最大]
type Range = [number, number];

const isSame = (a?: FloatButtonOffset, b?: FloatButtonOffset) => {
	return !!a && !!b && Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
};

/**
 * FloatButton / MFloatButton 共用的定位、拖动、吸边与渲染
 * 	- 边界区域：从原处向上查找滚动容器（vc Scroller / 滚动元素 / window），取它在视口中的可视区，避开安全区后再留出 gap；查找、portal、KeepAlive 见 useCarrierArea
 * 	- 按钮为 position: fixed，默认挂到 body；位置写在 transform 上，拖动时不触发重新渲染
 * 	- 贴住某条边后（默认右下角、吸边、拖到边上），边界尺寸变化时仍贴住这条边；其它位置只限制在边界内
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @param context.attrs ~
 * @param options ~
 * @param options.mobile 移动端（MFloatButton）：根节点加标记类 vcm-float-button，数字 gap 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useFloatButton = (
	props: Props,
	context: SetupContext<['update:offset', 'after-change', 'click']>,
	options: { mobile?: boolean } = {}
) => {
	const { slots, emit, expose, attrs } = context;
	const name = options.mobile ? 'vc-float-button vcm-float-button' : 'vc-float-button';
	const rem = options.mobile ? useRem({ element: resolvePortalElement() }) : null;

	const button = shallowRef<HTMLButtonElement>();
	// 首次定位前、边界区域移出视口、KeepAlive 失活时隐藏
	const hidden = ref(true);
	const dragging = ref(false);
	// 吸边、方向键移动时打开过渡
	const snapping = ref(false);

	// 边界区域左上角（视口 px），位置相对它
	let origin = { left: 0, top: 0 };
	// 可停留的范围（相对边界区域左上角）
	const bounds: Record<FloatButtonAxis, Range> = { x: [0, 0], y: [0, 0] };
	// 自身尺寸、安全区与 gap（px）：只在自身尺寸、--vc-rem、gap、窗口尺寸变化时重新量，滚动时只量边界区域
	const metrics = { width: 0, height: 0, gap: [0, 0], safe: { top: 0, right: 0, bottom: 0, left: 0 } };
	// 当前位置
	const position: FloatButtonOffset = { x: 0, y: 0 };
	const stick: Record<FloatButtonAxis, Side> = { x: null, y: null };
	// 待定位的位置：下次定位时限制到范围内
	let pending: FloatButtonOffset | null = null;

	// 停到指定位置；不传时回到右下角（贴住右边和下边）
	const place = (offset?: FloatButtonOffset) => {
		pending = offset ? { ...offset } : null;
		stick.x = offset ? null : 'end';
		stick.y = offset ? null : 'end';
	};
	place(props.offset);

	const canDrag = (axis: FloatButtonAxis) => props.draggable === true || props.draggable === axis;

	const clamp = (value: number, axis: FloatButtonAxis) => {
		const [min, max] = bounds[axis];
		return Math.min(Math.max(value, min), max);
	};

	const getEdge = (axis: FloatButtonAxis, side: 'start' | 'end') => bounds[axis][side === 'start' ? 0 : 1];

	// 按当前位置记下贴住的边
	const syncStick = () => {
		(['x', 'y'] as const).forEach((axis) => {
			const [min, max] = bounds[axis];
			const value = position[axis];
			stick[axis] = value <= min + 0.5 ? 'start' : value >= max - 0.5 ? 'end' : null;
		});
	};

	// 吸到较近的边：'x' / 'y' 只看该方向，true 看四边
	const snap = () => {
		const { magnetic } = props;
		if (!magnetic) return;
		const distance = (axis: FloatButtonAxis) => {
			const [min, max] = bounds[axis];
			return [position[axis] - min, max - position[axis]];
		};
		const axes: FloatButtonAxis[] = magnetic === true
			? [Math.min(...distance('x')) <= Math.min(...distance('y')) ? 'x' : 'y']
			: [magnetic];
		axes.forEach((axis) => {
			const [toStart, toEnd] = distance(axis);
			position[axis] = getEdge(axis, toStart <= toEnd ? 'start' : 'end');
		});
	};

	const write = () => {
		button.value && (button.value.style.transform = `translate3d(${origin.left + position.x}px, ${origin.top + position.y}px, 0)`);
	};

	const emitOffset = () => {
		const value = { x: position.x, y: position.y };
		isSame(value, props.offset) || emit('update:offset', value);
		return value;
	};

	// 安全区：样式把 env(safe-area-inset-*) 写在 scroll-margin 上（对 fixed 元素无副作用），这里读计算值
	const measure = () => {
		const el = button.value;
		if (!el) return;
		const css = getComputedStyle(el);
		const value = props.gap ?? (options.mobile ? 48 : 24);
		const unit = rem ? rem.value : 1;
		metrics.width = el.offsetWidth;
		metrics.height = el.offsetHeight;
		metrics.gap = (Array.isArray(value) ? value : [value, value]).map(v => v * unit);
		metrics.safe = {
			top: parseFloat(css.scrollMarginTop) || 0,
			right: parseFloat(css.scrollMarginRight) || 0,
			bottom: parseFloat(css.scrollMarginBottom) || 0,
			left: parseFloat(css.scrollMarginLeft) || 0
		};
	};

	/**
	 * 量边界区域，重新计算范围并定位：贴边的按贴住的边，其它限制在范围内
	 */
	const reposition = () => {
		const carrier = area.getCarrier();
		if (!carrier || !button.value) return;
		const rect = getCarrierArea(carrier);
		hidden.value = !rect.visible;
		if (!rect.visible) return;

		const { width, height, gap: [gapX, gapY], safe } = metrics;
		origin = { left: rect.left, top: rect.top };
		const minX = Math.max(rect.left, safe.left) + gapX - rect.left;
		const minY = Math.max(rect.top, safe.top) + gapY - rect.top;
		const maxX = Math.min(rect.right, rect.viewportWidth - safe.right) - gapX - width - rect.left;
		const maxY = Math.min(rect.bottom, rect.viewportHeight - safe.bottom) - gapY - height - rect.top;
		// 区域放不下按钮时停在左上
		bounds.x = [minX, Math.max(maxX, minX)];
		bounds.y = [minY, Math.max(maxY, minY)];

		if (pending) {
			position.x = clamp(pending.x, 'x');
			position.y = clamp(pending.y, 'y');
			pending = null;
			syncStick();
		} else {
			(['x', 'y'] as const).forEach((axis) => {
				const side = stick[axis];
				position[axis] = side ? getEdge(axis, side) : clamp(position[axis], axis);
			});
		}
		write();
		emitOffset();
	};

	const relayout = () => {
		measure();
		reposition();
	};

	// 外层滚动、容器尺寸变化时只重新量边界区域；窗口尺寸变化、重新绑定时连同自身一起量
	const area = useCarrierArea({
		portal: () => props.portal,
		target: button,
		placeholderClass: 'vc-float-button__placeholder',
		listeners: { layout: reposition, resize: relayout },
		onDeactivated: () => {
			hidden.value = true;
		}
	});

	let snapTimer: ReturnType<typeof setTimeout> | undefined;
	// 打开过渡后再写位置，让吸边、按键移动有动画
	const moveTo = async (before: FloatButtonOffset) => {
		syncStick();
		const value = emitOffset();
		if (isSame(value, before)) return;
		clearTimeout(snapTimer);
		snapping.value = true;
		await nextTick();
		write();
		snapTimer = setTimeout(() => (snapping.value = false), SNAP_DURATION);
		emit('after-change', value);
	};

	// 拖动后紧跟的原生 click 不算点按
	let isClickSuppressed = false;
	let start: FloatButtonOffset = { x: 0, y: 0 };

	const gesture = useGesture({
		moveStart: () => {
			isClickSuppressed = true;
			clearTimeout(snapTimer);
			snapping.value = false;
			start = { ...position };
			dragging.value = true;
		},
		move: (e) => {
			if (!dragging.value) return;
			canDrag('x') && (position.x = clamp(start.x + e.offsetX, 'x'));
			canDrag('y') && (position.y = clamp(start.y + e.offsetY, 'y'));
			write();
			emitOffset();
		},
		moveEnd: () => {
			if (!dragging.value) return;
			dragging.value = false;
			snap();
			moveTo(start);
		}
	});

	const handlePointerDown = (e: PointerEvent) => {
		isClickSuppressed = false;
		gesture.listeners.onPointerdown(e);
	};

	const handleClick = (e: MouseEvent) => {
		if (isClickSuppressed) {
			isClickSuppressed = false;
			return;
		}
		emit('click', e);
	};

	/**
	 * 方向键移动：只在可拖动的方向上；该方向会吸边时直接移到那一边，否则移动一步
	 * @param e ~
	 */
	const handleKeydown = (e: KeyboardEvent) => {
		const key = KEYS[e.key];
		if (!key || !canDrag(key[0]) || e.altKey || e.ctrlKey || e.metaKey) return;
		e.preventDefault();
		const [axis, sign] = key;
		const before = { ...position };
		const { magnetic } = props;
		const isJump = magnetic === axis || (magnetic === true && !!stick[axis]);
		position[axis] = isJump
			? getEdge(axis, sign < 0 ? 'start' : 'end')
			: clamp(position[axis] + sign * (e.shiftKey ? KEY_STEP_LARGE : KEY_STEP), axis);
		moveTo(before);
	};

	// 回到默认的右下角
	const reset = () => {
		place();
		reposition();
	};

	// 外部改了 offset（不是自己同步出去的值）时移过去
	watch(() => props.offset, (value) => {
		if (!value || isSame(value, position)) return;
		place(value);
		reposition();
	}, { deep: true });
	watch(() => props.gap, relayout, { deep: true });
	rem && watch(rem, relayout);

	// 内容尺寸变化（插槽、样式变量）时重新计算范围
	let offResize: (() => void) | undefined;
	watch(button, (el) => {
		offResize?.();
		offResize = el && Resize.on(el, relayout, SHARED);
	});

	onBeforeUnmount(() => {
		clearTimeout(snapTimer);
		offResize?.();
	});

	// refresh：重新查找边界区域并定位（如滚动容器由外部替换后）
	expose({ refresh: area.refresh, reset });

	const renderButton = () => {
		const isDraggable = !!props.draggable;
		return (
			<button
				{...attrs}
				ref={button}
				type="button"
				class={[
					name,
					`is-${props.shape}`,
					{
						'is-draggable': isDraggable,
						'is-dragging': dragging.value,
						'is-snapping': snapping.value,
						'is-hidden': hidden.value
					}
				]}
				style={{ zIndex: props.zIndex }}
				aria-hidden={hidden.value ? 'true' : undefined}
				tabindex={hidden.value ? -1 : undefined}
				onClick={handleClick}
				onKeydown={isDraggable ? handleKeydown : undefined}
				{...(isDraggable ? { ...gesture.listeners, onPointerdown: handlePointerDown } : {})}
			>
				{
					slots.default
						? slots.default({ dragging: dragging.value })
						: props.icon && <Icon type={props.icon} class="vc-float-button__icon" />
				}
			</button>
		);
	};

	return () => area.render(renderButton());
};
