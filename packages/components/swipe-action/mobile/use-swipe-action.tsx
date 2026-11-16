/** @jsxImportSource vue */

import { ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
import type { SetupContext, VNodeChild } from 'vue';
import { DRAG_IGNORE, canScrollToward, isScroller, useDrag } from '@deot/vc-hooks';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import type { Props, SwipeActionItem, SwipeActionValue, SwipeActionSide } from './swipe-action-props';

// 移动超过该距离（px）才判定方向
const AXIS_THRESHOLD = 10;
// 快速甩动：横向超过该距离（px）且松手前速度（px/ms）超过阈值时，按方向展开或收起
const FLICK_DISTANCE = 20;
const VELOCITY_THRESHOLD = 0.3;
// 松手前停顿超过该时长（ms）时速度按 0 计
const VELOCITY_IDLE = 100;
// 全滑：拖过组件宽度的这个比例
const FULL_RATIO = 0.5;
// 超出按钮总宽的部分只走 1/4（与 MPicker 越界相同）
const DAMPING = 4;
// 展开带一点回弹，收起不回弹
const OPEN_CURVE = 'cubic-bezier(0.2, 0.8, 0.32, 1.28)';
const CLOSE_CURVE = 'cubic-bezier(0.34, 0.69, 0.1, 1)';

const SIDES: SwipeActionSide[] = ['left', 'right'];

// 起点到组件之间，有元素还能朝手指方向横向滚动：交给它
const canScrollX = (target: Element | null, root: Element, delta: number) => {
	for (let el = target as HTMLElement | null; el && el !== root; el = el.parentElement) {
		if (el.scrollWidth > el.clientWidth && isScroller(el, 'x') && canScrollToward(el, 'x', delta)) return true;
	}
	return false;
};

// 当前画面上的横向位移：动画中按下时从这里接着拖；读不到矩阵（如还没绘制）时返回 null
const readTranslate = (el: HTMLElement) => {
	const match = /matrix(3d)?\(([^)]+)\)/.exec(window.getComputedStyle(el).transform);
	if (!match) return null;
	const values = match[2].split(',').map(Number);
	return (match[1] ? values[12] : values[4]) || 0;
};

const isSameWidths = (a: number[], b: number[]) => a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * MSwipeAction 与 MListItem 共用：左右滑出操作按钮（MListItem 经 toSwipeActionProps 转成相同的 props）
 * 	- 根节点绑定 root、listeners（含捕获阶段的 click），内容放进 renderTrack
 * 	- 按钮宽度只在手势开始、代码打开时测量，长列表中没有额外开销
 * @param props ~
 * @param context ~
 * @returns ~
 */
export const useSwipeAction = (props: Props, context: SetupContext<['update:modelValue']>) => {
	const { emit } = context;

	const root = ref<HTMLElement>();
	const track = ref<HTMLElement>();
	const panels = { left: ref<HTMLElement>(), right: ref<HTMLElement>() };

	// 轨道位移（px）：正数露出左侧按钮
	const offset = ref(0);
	// 拖动中不加过渡
	const isMoving = ref(false);
	const curve = ref(CLOSE_CURVE);
	// 全滑中的一侧：最外侧按钮铺满露出区域
	const fullSide = ref<SwipeActionSide | null>(null);
	// 各按钮的自然宽度，与数组顺序一致
	const widths = shallowRef<Record<SwipeActionSide, number[]>>({ left: [], right: [] });

	// 当前状态，与 v-model 同步
	let current: SwipeActionValue = false;
	// 全滑的动画、onClick 返回的 Promise 未结束：不响应手势与收起
	let pending = false;
	// 拖动后紧接的 click（鼠标松开处）不触发
	let suppressClick = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const getActions = (side: SwipeActionSide) => (side === 'left' ? props.leftActions : props.rightActions) || [];
	const hasActions = () => !!(props.leftActions?.length || props.rightActions?.length);
	const getTotal = (side: SwipeActionSide) => widths.value[side].reduce((sum, width) => sum + width, 0);
	const getSign = (side: SwipeActionSide) => (side === 'left' ? 1 : -1);
	// 最外侧的一项：左侧为第一项，右侧为最后一项
	const getOuterIndex = (side: SwipeActionSide) => (side === 'left' ? 0 : getActions(side).length - 1);
	const canFullSwipe = (side: SwipeActionSide) => {
		const item = getActions(side)[getOuterIndex(side)];
		return !!(item?.fullSwipe && !item.disabled);
	};

	const measure = () => {
		// 全滑时最外侧按钮被拉宽，沿用手势开始时量到的宽度
		if (fullSide.value) return;
		const next = { ...widths.value };
		let changed = false;
		SIDES.forEach((side) => {
			const panel = panels[side].value;
			const value = panel ? Array.from(panel.children, child => (child as HTMLElement).offsetWidth) : [];
			if (isSameWidths(value, next[side])) return;
			next[side] = value;
			changed = true;
		});
		changed && (widths.value = next);
	};

	// 展开时才监听外部按下，收起后移除；按下别的行对已展开的行就是外部，所以同一时间只展开一行
	let isListening = false;
	const handleOutside = (e: Event) => {
		if (!props.closeOnClickOutside || pending || root.value?.contains(e.target as Node)) return;
		close();
	};
	const toggleOutside = (add: boolean) => {
		if (isListening === add) return;
		isListening = add;
		(add ? document.addEventListener : document.removeEventListener)('pointerdown', handleOutside, true);
	};

	const sync = (value: SwipeActionValue) => {
		toggleOutside(!!value);
		if (current === value) return;
		current = value;
		emit('update:modelValue', value);
	};

	const animateTo = (value: number) => {
		curve.value = Math.abs(value) >= Math.abs(offset.value) && value ? OPEN_CURVE : CLOSE_CURVE;
		isMoving.value = false;
		offset.value = value;
	};

	const close = () => {
		fullSide.value = null;
		animateTo(0);
		sync(false);
	};

	const open = (side: SwipeActionSide) => {
		if (!getActions(side).length) return close();
		measure();
		fullSide.value = null;
		animateTo(getSign(side) * getTotal(side));
		sync(side);
	};

	// 规则与 MModal 的 data[] 相同：真值保持展开，Promise resolve 后收起、reject 时保持展开，其余收起
	const trigger = (item: SwipeActionItem, e: Event) => {
		const restore = () => (current ? open(current) : close());
		const result = item.onClick?.(e);
		if (result && typeof result.then === 'function') {
			pending = true;
			result.then(
				() => {
					pending = false;
					close();
				},
				() => {
					pending = false;
					restore();
				}
			);
			return;
		}
		result ? restore() : close();
	};

	const handleActionClick = (item: SwipeActionItem, e: Event) => {
		// 不再冒泡到内容（如 MListItem 的跳转）
		e.stopPropagation();
		if (item.disabled || pending) return;
		trigger(item, e);
	};

	// 全滑松手：整行滑到底，动画结束后执行最外侧的一项
	const fullSwipe = (side: SwipeActionSide, e: Event) => {
		const item = getActions(side)[getOuterIndex(side)];
		animateTo(getSign(side) * root.value!.offsetWidth);
		sync(side);
		pending = true;
		timer = setTimeout(() => {
			pending = false;
			trigger(item, e);
		}, props.duration);
	};

	// 拖动中的位移：普通情况超出按钮总宽后阻尼；最外侧可全滑时跟手，过半进入全滑
	const setOffset = (raw: number) => {
		const side: SwipeActionSide = raw > 0 ? 'left' : 'right';
		if (!raw || !getActions(side).length) {
			offset.value = 0;
			fullSide.value = null;
			return;
		}
		const distance = Math.abs(raw);
		const total = getTotal(side);
		let value: number;
		if (canFullSwipe(side)) {
			const width = root.value!.offsetWidth;
			value = Math.min(distance, width);
			fullSide.value = value > width * FULL_RATIO ? side : null;
		} else {
			value = distance > total ? total + (distance - total) / DAMPING : distance;
			fullSide.value = null;
		}
		offset.value = getSign(side) * value;
	};

	let startX = 0;
	let startY = 0;
	let startOffset = 0;
	let lastX = 0;
	let lastTime = 0;
	let velocity = 0;
	let axis: 'x' | 'y' | null = null;
	let target: Element | null = null;

	const drag = useDrag({
		selectable: false,
		start: (e, point) => {
			if (props.disabled || pending || !hasActions()) return false;
			target = e.target as Element;
			if (target?.closest?.(DRAG_IGNORE)) return false;
			measure();
			startX = lastX = point.clientX;
			startY = point.clientY;
			lastTime = Date.now();
			velocity = 0;
			axis = null;
			startOffset = offset.value && track.value ? (readTranslate(track.value) ?? offset.value) : 0;
		},
		move: (e, point) => {
			const dx = point.clientX - startX;
			const dy = point.clientY - startY;
			if (!axis) {
				if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_THRESHOLD) return;
				// 内层已接管、纵向、内部还能横向滚动、收起时手指方向一侧没有按钮：都不接管
				const isClaimed = !e.defaultPrevented
					&& Math.abs(dx) > Math.abs(dy)
					&& !canScrollX(target, root.value!, dx)
					&& (!!startOffset || !!getActions(dx < 0 ? 'right' : 'left').length);
				axis = isClaimed ? 'x' : 'y';
				if (!isClaimed) return;
				isMoving.value = true;
			}
			if (axis !== 'x') return;

			e.cancelable && e.preventDefault();
			const now = Date.now();
			velocity = (point.clientX - lastX) / Math.max(1, now - lastTime);
			lastX = point.clientX;
			lastTime = now;
			setOffset(startOffset + dx);
		},
		end: (e, point) => {
			if (axis !== 'x') return;
			axis = null;
			suppressClick = true;
			setTimeout(() => (suppressClick = false));

			const value = offset.value;
			const side: SwipeActionSide = value > 0 ? 'left' : 'right';
			if (fullSide.value) return fullSwipe(fullSide.value, e);
			if (!value) return close();

			const speed = Date.now() - lastTime > VELOCITY_IDLE ? 0 : velocity;
			const isFlick = Math.abs(point.clientX - startX) >= FLICK_DISTANCE && Math.abs(speed) >= VELOCITY_THRESHOLD;
			const ratio = Math.abs(value) / (getTotal(side) || 1);
			const shouldOpen = isFlick
				? getSign(side) * speed > 0
				: ratio > (current === side ? 1 - props.threshold : props.threshold);
			shouldOpen ? open(side) : close();
		},
		cancel: () => {
			if (axis !== 'x') return;
			axis = null;
			current ? open(current) : close();
		}
	});

	// 展开时点内容区只收起；拖动后紧接的 click 一律不触发
	const handleClickCapture = (e: MouseEvent) => {
		const isAction = SIDES.some(side => panels[side].value?.contains(e.target as Node));
		if (!suppressClick && (isAction || !offset.value)) return;
		e.stopImmediatePropagation();
		e.preventDefault();
		!suppressClick && !pending && close();
	};

	watch(
		() => props.modelValue,
		(value) => {
			if (value === current) return;
			value ? open(value) : close();
		}
	);

	// 操作项变化：展开的一侧没有按钮了就收起，否则按新的宽度重新展开
	watch(
		() => [props.leftActions, props.rightActions],
		() => {
			if (!current || pending || isMoving.value) return;
			open(current);
		},
		{ flush: 'post' }
	);

	onMounted(() => {
		props.modelValue && open(props.modelValue);
	});

	onBeforeUnmount(() => {
		clearTimeout(timer);
		toggleOutside(false);
	});

	const getClasses = () => ({
		'is-moving': isMoving.value,
		'is-swiping': isMoving.value || !!offset.value
	});

	const renderActions = (side: SwipeActionSide) => {
		const actions = getActions(side);
		if (!actions.length) return null;

		const list = widths.value[side];
		const total = getTotal(side);
		const distance = getSign(side) * offset.value;
		const outerIndex = getOuterIndex(side);
		let sum = 0;
		return (
			<div
				ref={panels[side]}
				class={['vcm-swipe-action__actions', `is-${side}`]}
				style={{ width: distance > 0 ? `${distance}px` : 0 }}
			>
				{
					actions.map((item, index) => {
						const before = sum;
						sum += list[index] || 0;
						const isFull = fullSide.value === side && index === outerIndex;
						// 按「内侧各项宽度之和 / 总宽」的比例定位，随露出宽度同比展开；外侧的叠在上层
						const position = side === 'right'
							? { left: isFull || !total ? 0 : `${before / total * 100}%`, zIndex: index + 1 }
							: { right: isFull || !total ? 0 : `${(total - sum) / total * 100}%`, zIndex: actions.length - index };
						return (
							<div
								key={index}
								class={[
									'vcm-swipe-action__action',
									`is-${item.type || 'default'}`,
									{ 'is-disabled': item.disabled, 'is-full': isFull },
									item.class
								]}
								style={[position, item.style]}
								onClick={(e: Event) => handleActionClick(item, e)}
							>
								{item.icon && <MIcon type={item.icon} class="vcm-swipe-action__icon" />}
								{hasCustomerValue(item.content) && <MCustomer wrap class="vcm-swipe-action__content" render={item.content} />}
							</div>
						);
					})
				}
			</div>
		);
	};

	/**
	 * 轨道：左侧按钮、内容、右侧按钮
	 * @param content 内容
	 * @param style 轨道上的额外样式（如 MListItem 的缩进）
	 * @returns ~
	 */
	const renderTrack = (content: VNodeChild, style?: any) => {
		return (
			<div
				ref={track}
				class="vcm-swipe-action__track"
				style={[
					{
						'transform': offset.value ? `translate3d(${offset.value}px, 0, 0)` : '',
						'--vc-swipe-action-duration': isMoving.value ? '0ms' : `${props.duration}ms`,
						'--vc-swipe-action-timing': curve.value
					},
					style
				]}
			>
				{renderActions('left')}
				{content}
				{renderActions('right')}
			</div>
		);
	};

	// 绑到根节点：拖动手势与捕获阶段的点击拦截
	const listeners = { ...drag.listeners, onClickCapture: handleClickCapture } as Record<string, (e: any) => void>;

	return {
		root,
		listeners,
		hasActions,
		getClasses,
		renderTrack
	};
};
