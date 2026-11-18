/** @jsxImportSource vue */

import { computed, defineComponent, ref, onBeforeUnmount, onMounted, watchEffect } from 'vue';
import { prefixStyle } from '@deot/helper-dom';
import { useDrag } from '@deot/vc-hooks';
import { cloneDeep } from 'lodash-es';
import { Customer } from '../../customer';
import { findEnabledIndex, getRowLabel, getRowValue } from './utils';
import type { PickerData, PickerValue } from '../types';
import { renderType } from '../../customer/customer-props';
import type { PropType } from 'vue';

const COMPONENT_NAME = 'vcm-picker-col';
// 读不到渲染高度时（如未挂载到文档）的行高
const ITEM_HEIGHT = 44;
// 位移超过它才算拖动，松开后不触发点击
const TAP_THRESHOLD = 4;
// 惯性：手势时长小于 300ms 且位移超过 2 行时，按减速度计算终点
const MOMENTUM_TIME = 300;
const MOMENTUM_ROWS = 2;
const DECELERATION = 0.003;
// 动画：吸附 / 点击 200ms，滚轮 150ms，惯性 400ms，越界的惯性按越界程度 100 / 75ms 回弹
const SNAP_DURATION = 200;
const WHEEL_DURATION = 150;
const MOMENTUM_DURATION = 400;
const EASE = 'ease';
const EASE_MOMENTUM = 'cubic-bezier(.17, .89, .45, 1)';
const EASE_BOUNCE = 'cubic-bezier(.25, .46, .45, .94)';
// 滚轮：一次超过它即滚一项，触控板的小增量累积到它再滚
const WHEEL_STEP = 50;
// 只渲染可见窗口（virtualized）时，可见行之外上下各多渲染的行数
const OVERSCAN = 3;
// 读不到列高（如未挂载到文档）时的可见行数，同 --vc-picker-rows 的默认值
const VISIBLE_ROWS = 5;
const TRANSFORM = prefixStyle('transform').camel;
const TRANSFORM_KEBAB = prefixStyle('transform').kebab;
const TRANSITION = prefixStyle('transition').camel;

export const PickerCol = defineComponent({
	name: COMPONENT_NAME,
	props: {
		index: Number,
		data: {
			type: Array as PropType<PickerData[]>,
			default: () => []
		},
		itemStyle: Object as PropType<Record<string, any>>,
		value: [String, Number, Boolean] as PropType<PickerValue>,
		renderLabel: renderType,
		// 只渲染可见窗口附近的行，用于选项很多的列
		virtualized: Boolean
	},
	emits: ['change'],
	setup(props, { emit }) {
		const root = ref<HTMLElement>();
		const wrapper = ref<HTMLElement>();
		const itemHeight = ref(ITEM_HEIGHT);
		const visibleRows = ref(VISIBLE_ROWS);
		// 动画的起点（px，从首项算起）：过渡途中不会重新渲染，窗口要覆盖起点到终点
		const animationFrom = ref<number | null>(null);
		// 按下时的位置（px）：拖动期间窗口一直包含它。触摸事件只派发给按下的那一行，
		// 它被移出窗口（从文档中删掉）后 touchmove / touchend 不再冒泡到列上，手势会停在半路
		const dragFrom = ref<number | null>(null);
		// 相对选中项的位移（px，向上为正）；位置 = 选中项 × 行高 + offset
		const offset = ref(0);
		// 动画：时长为 0 时跟手
		const duration = ref(0);
		const easing = ref(EASE);
		// 动画中的目标项：选中项先切过去，松手后的 change 立即发出
		const animatingIndex = ref(-1);

		let startX = 0;
		let startY = 0;
		let startTime = 0;
		let startPosition = 0;
		// 第一次移动时判定：纵向时接管，横向时放弃
		let direction: '' | 'x' | 'y' = '';
		let moved = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let wheelDelta = 0;

		const selectedIndex = computed(() => {
			const index = props.data.findIndex(item => getRowValue(item) === props.value);
			return index >= 0 ? index : 0;
		});

		// 显示的选中项：动画中为目标项
		const currentIndex = computed(() => (animatingIndex.value >= 0 ? animatingIndex.value : selectedIndex.value));
		const maxIndex = computed(() => Math.max(props.data.length - 1, 0));

		// 位移与过渡直接写在节点上，不经过渲染：拖动时 offset 逐帧变化，整列不必逐帧重渲染
		// 位置 = 选中项 × 行高（随 --vcm-picker-item-height）+ offset
		watchEffect(() => {
			const el = wrapper.value;
			if (!el) return;
			const sign = offset.value < 0 ? '+' : '-';
			const y = `calc(var(--vcm-picker-item-height) * ${-currentIndex.value} ${sign} ${Math.abs(offset.value)}px)`;
			el.style[TRANSFORM as any] = `translate3d(0, ${y}, 0)`;
			el.style[TRANSITION as any] = duration.value ? `${TRANSFORM_KEBAB} ${duration.value}ms ${easing.value}` : 'none';
		}, { flush: 'post' });

		const clamp = (index: number) => Math.min(Math.max(index, 0), maxIndex.value);

		const measure = () => {
			const item = wrapper.value?.querySelector<HTMLElement>('.vcm-picker-col__item');
			itemHeight.value = item?.getBoundingClientRect().height || ITEM_HEIGHT;
			// 列高 = 行高 × 可见行数（picker-col.scss），由它推出可见行数，不必读 CSS 变量
			props.virtualized && (visibleRows.value = Math.round((root.value?.offsetHeight || 0) / itemHeight.value) || VISIBLE_ROWS);
		};

		/**
		 * 渲染的行（virtualized）：当前位置所在的行上下各 (可见行数 - 1) / 2 + OVERSCAN 行；
		 * 动画期间再并上起点所在的窗口（惯性跨过的行都在其中，结束后收回），拖动期间并上按下时的位置
		 * 	- 拖动时位置逐帧变化，窗口跟着重算，进出窗口的只有少数几行
		 * 	- 行高固定（--vcm-picker-item-height），窗口按位置直接算出，不必逐行测量
		 */
		const range = computed(() => {
			const max = maxIndex.value;
			if (!props.virtualized) return [0, max];
			const h = itemHeight.value;
			const half = Math.ceil((visibleRows.value - 1) / 2) + OVERSCAN;
			const position = (currentIndex.value * h + offset.value) / h;
			let from = position;
			let to = position;
			[animationFrom.value, dragFrom.value].forEach((anchor) => {
				if (anchor === null) return;
				from = Math.min(from, anchor / h);
				to = Math.max(to, anchor / h);
			});
			return [Math.max(0, Math.floor(from) - half), Math.min(max, Math.ceil(to) + half)];
		});
		// 窗口的起止拆成数字：位置逐帧变化但窗口不变时，不触发渲染
		const rangeStart = computed(() => range.value[0]);
		const rangeEnd = computed(() => range.value[1]);

		// 当前位置（px，从首项算起）：动画中读计算样式，停在画面上的位置
		const readPosition = () => {
			const base = currentIndex.value * itemHeight.value + offset.value;
			if (!duration.value || !wrapper.value) return base;
			const current = window.getComputedStyle(wrapper.value);
			const matrix = (current.transform || current[TRANSFORM as any]) as string;
			const values = /matrix(?:3d)?\((.+)\)/.exec(matrix || '')?.[1].split(',').map(Number);
			if (!values) return base;
			// matrix(a, b, c, d, tx, ty) / matrix3d 的 ty 为第 14 项
			const y = values.length === 16 ? values[13] : values[5];
			return Number.isFinite(y) ? -y : base;
		};

		const clearTimer = () => {
			timer && clearTimeout(timer);
			timer = void 0;
		};

		// 滚到 index（带动画），值变化时立即 emit
		// 位移与过渡在同一次更新里切换：浏览器从当前画面位置（含进行中的过渡）过渡到目标项
		// 落在禁用行上时改到最近的可选行，距离相同时取移动方向一侧；整列都被禁用时回到选中项
		const scrollTo = (index: number, ms: number, ease = EASE) => {
			const clamped = clamp(index);
			const enabled = findEnabledIndex(props.data, clamped, clamped < selectedIndex.value ? -1 : 1);
			const target = enabled >= 0 ? enabled : selectedIndex.value;
			props.virtualized && (animationFrom.value = readPosition());
			clearTimer();
			animatingIndex.value = target;
			offset.value = 0;
			duration.value = ms;
			easing.value = ease;
			timer = setTimeout(() => {
				timer = void 0;
				duration.value = 0;
				animatingIndex.value = -1;
				animationFrom.value = null;
			}, ms);

			if (target !== selectedIndex.value && props.data[target]) {
				emit('change', cloneDeep(props.data[target]));
			}
		};

		// 越界阻尼：超出首项、末项的部分只走 1/4
		const damp = (position: number) => {
			const max = maxIndex.value * itemHeight.value;
			if (position < 0) return position / 4;
			if (position > max) return max + (position - max) / 4;
			return position;
		};

		const handleStart = (e: MouseEvent | TouchEvent, x: number, y: number) => {
			if (!props.data.length) return false;
			measure();

			// 动画中按住：停在当前画面位置；这次轻点只停下，不算点击
			const animating = !!duration.value;
			const position = readPosition();
			clearTimer();
			duration.value = 0;
			animatingIndex.value = -1;
			animationFrom.value = null;
			offset.value = position - selectedIndex.value * itemHeight.value;

			startX = x;
			startY = y;
			startTime = Date.now();
			startPosition = position;
			props.virtualized && (dragFrom.value = position);
			direction = e.type === 'mousedown' ? 'y' : '';
			moved = animating;
			return true;
		};

		const handleMove = (e: MouseEvent | TouchEvent, x: number, y: number) => {
			if (!direction) {
				if (x === startX && y === startY) return;
				direction = Math.abs(x - startX) > Math.abs(y - startY) ? 'x' : 'y';
			}
			// 横向：交给外层（MTabs、MCarousel、MPopup 侧滑等），不阻止默认行为
			if (direction === 'x') return;
			// 纵向：阻止页面滚动；外层的 useScrollContain 据 defaultPrevented 跳过本次手势
			e.cancelable && e.preventDefault();

			if (Math.abs(y - startY) > TAP_THRESHOLD) moved = true;
			offset.value = damp(startPosition + startY - y) - selectedIndex.value * itemHeight.value;
		};

		const settle = (position: number, ms: number, ease: string) => {
			scrollTo(Math.round(position / itemHeight.value), ms, ease);
		};

		const handleEnd = (y: number) => {
			if (direction === 'x') {
				offset.value = 0;
				return;
			}
			const position = selectedIndex.value * itemHeight.value + offset.value;
			const distance = startY - y;
			const time = Date.now() - startTime;

			if (time < MOMENTUM_TIME && Math.abs(distance) > itemHeight.value * MOMENTUM_ROWS) {
				const speed = (2 * Math.abs(distance)) / time;
				const destination = position + (speed / DECELERATION) * Math.sign(distance);
				const max = maxIndex.value * itemHeight.value;
				const overflow = destination < 0 ? -destination : destination > max ? destination - max : 0;
				if (!overflow) {
					settle(destination, MOMENTUM_DURATION, EASE_MOMENTUM);
				} else {
					settle(destination, overflow > 300 ? 75 : 100, EASE_BOUNCE);
				}
				return;
			}

			settle(position, SNAP_DURATION, EASE);
		};

		// 回弹到当前选中项；手势被打断（touchcancel、mouseup 丢失）时只回弹，不选中
		const reset = () => {
			direction = '';
			scrollTo(selectedIndex.value, SNAP_DURATION);
		};

		const drag = useDrag({
			start: (e, point) => handleStart(e, point.screenX, point.screenY),
			move: (e, point) => handleMove(e, point.screenX, point.screenY),
			// 手势结束后不再需要保留按下的那一行（松手后的动画由 animationFrom 覆盖）
			end: (_, point) => {
				handleEnd(point.screenY);
				dragFrom.value = null;
			},
			cancel: () => {
				reset();
				dragFrom.value = null;
			}
		});

		// 点击某一项：滚到该项；拖动过的手势不算点击，禁用行不响应。整列一个监听，按行上的 data-index 找到该项
		const handleClick = (e: MouseEvent) => {
			if (moved) {
				moved = false;
				return;
			}
			const el = (e.target as Element).closest<HTMLElement>('.vcm-picker-col__item');
			if (!el) return;
			const index = +el.dataset.index!;
			if (props.data[index]?.disabled) return;
			measure();
			scrollTo(index, SNAP_DURATION);
		};

		// 该方向上的下一个可选行；没有时为 -1
		const nextEnabled = (index: number, step: number) => {
			for (let i = index + step; i >= 0 && i <= maxIndex.value; i += step) {
				if (!props.data[i].disabled) return i;
			}
			return -1;
		};

		// 滚轮：一格一项，跳过禁用行；该方向上已没有可选行时不阻止，页面照常滚动
		const handleWheel = (e: WheelEvent) => {
			if (!props.data.length || !e.deltaY) return;
			const step = Math.sign(e.deltaY);
			const index = currentIndex.value;
			const next = nextEnabled(index, step);
			if (next < 0) {
				wheelDelta = 0;
				return;
			}
			e.preventDefault();

			// deltaMode：0 像素、1 行、2 页
			const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
			wheelDelta = Math.sign(wheelDelta) === step ? wheelDelta + delta : delta;
			if (Math.abs(wheelDelta) < WHEEL_STEP) return;
			wheelDelta = 0;
			measure();
			scrollTo(next, WHEEL_DURATION);
		};

		onMounted(() => props.virtualized && measure());
		onBeforeUnmount(clearTimer);

		const renderItem = (item: PickerData, index: number) => {
			const label = getRowLabel(item);
			// label 本身可以是字符串，也可以是渲染函数
			const render = props.renderLabel || (typeof label === 'function' ? label : void 0);

			// 只在窗口或选中项变化时重渲染（位移不经过渲染）
			return render
				? (<Customer render={render} label={label} row={item} index={index} />)
				: label;
		};

		const renderRow = (item: PickerData, index: number, current: number) => {
			return (
				<div
					key={index}
					data-index={index}
					style={props.itemStyle}
					class={['vcm-picker-col__item', { 'is-selected': index === current, 'is-disabled': item.disabled }]}
				>
					{ renderItem(item, index) }
				</div>
			);
		};

		// 渲染窗口内的行（不开启 virtualized 时为全部）；窗口之前的行用一个占位撑开，wrapper 的位移与上下留白不变
		const renderRows = (current: number) => {
			const start = rangeStart.value;
			const rows = props.data.slice(start, rangeEnd.value + 1).map((item, i) => renderRow(item, start + i, current));
			return start
				? [<div key="spacer" class="vcm-picker-col__spacer" style={{ height: `calc(var(--vcm-picker-item-height) * ${start})` }} />, ...rows]
				: rows;
		};

		return () => {
			const current = currentIndex.value;
			return (
				<div
					ref={root}
					class="vcm-picker-col"
					// 触摸不阻止 touchstart 的默认行为：轻点仍会触发 click；纵向拖动在 touchmove 中阻止
					onTouchstart={drag.listeners.onTouchstart}
					onTouchmove={drag.listeners.onTouchmove}
					onTouchend={drag.listeners.onTouchend}
					onTouchcancel={drag.listeners.onTouchcancel}
					onMousedown={(e: MouseEvent) => {
						// 鼠标拖动期间不选中文本
						e.preventDefault();
						drag.listeners.onMousedown(e);
					}}
					onWheel={handleWheel}
				>
					<div ref={wrapper} class="vcm-picker-col__wrapper" onClick={handleClick}>
						{ renderRows(current) }
					</div>
				</div>
			);
		};
	}
});
