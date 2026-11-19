/** @jsxImportSource vue */

import { ref, shallowRef, computed, h, cloneVNode, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { VNode, SetupContext } from 'vue';
import { getUid } from '@deot/helper-utils';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import { getChildren } from '../fragment/utils';
import { Icon } from '../icon';
import { SplitterPanel } from './splitter-panel';
import type { Props } from './splitter-props';
import type { SplitterResizePayload, SplitterCollapseChangePayload, SplitterPanelCollapsible } from './types';
import { parseSize, resolveSize, toLength, round, clamp, getCollapsible } from './utils';
import type { ParsedSize } from './utils';

interface PanelState extends ParsedSize {
	// 最近一次读入或经 v-model 回写的 size；props 与它不同时才重新解析
	source?: number | string;
	// 折叠前的尺寸（px），展开时恢复
	previous?: number;
	// 用于分隔条的 aria-controls
	id: string;
}

// 一次调整（拖动、键盘、折叠按钮）开始时的实测值，index 为分隔条序号
interface Session {
	index: number;
	elements: HTMLElement[];
	sizes: number[];
	available: number;
	total: number;
	// 前一个面板的上下限（px），两侧互相约束；冲突时 min 优先
	lower: number;
	upper: number;
	// 拖过 min 的一半时吸附到 0
	snapA: boolean;
	snapB: boolean;
}

interface DragSession extends Session {
	// 按下时的指针坐标
	start: number;
	// 最近一次算出的各面板尺寸，没有移动时就是 sizes
	current: number[];
	bar: HTMLElement;
	// lazy 时的预览线
	preview: HTMLElement | null;
}

// 键盘方向键每次调整的像素
const STEP = 10;

/**
 * Splitter：读取 SplitterPanel 的 props 计算布局，在面板之间插入分隔条
 * 拖动中直接改面板的样式，松开后再回写 v-model 并重绘，面板内容不随每次移动重新渲染
 * @param props ~
 * @param context ~
 * @returns render
 */
export const useSplitter = (
	props: Props,
	context: SetupContext<['resize-start', 'resize', 'resize-end', 'collapse-change']>
) => {
	const { slots, emit } = context;
	const current = ref<HTMLElement>();
	// 各分隔条的 aria-valuenow：前一个面板占可分配尺寸的百分比；调整完成后赋新值，同时触发重绘
	const values = ref<number[]>([]);
	const drag = shallowRef<DragSession | null>(null);

	const states = new Map<PropertyKey, PanelState>();
	// 最近一次渲染的面板（原始 / 克隆）、状态与可折叠配置
	let panels: VNode[] = [];
	let clones: VNode[] = [];
	let panelStates: PanelState[] = [];
	let collapsibles: SplitterPanelCollapsible[] = [];

	const classes = computed(() => {
		return ['vc-splitter', { 'is-vertical': props.vertical, 'is-dragging': !!drag.value }];
	});

	/**
	 * 按面板的 key（没有时按位置）对应状态；size 变了才重新解析，拖动结果在受控值回写前不会被覆盖
	 * @param vnodes ~
	 * @returns ~
	 */
	const sync = (vnodes: VNode[]) => {
		const keys = new Set<PropertyKey>();
		const result = vnodes.map((vnode, index) => {
			const key = vnode.key ?? `#${index}`;
			const size = vnode.props?.size;
			let state = states.get(key);
			keys.add(key);
			if (!state) {
				state = { id: getUid('splitter-panel'), source: size, ...parseSize(size) };
				states.set(key, state);
			} else if (state.source !== size) {
				Object.assign(state, parseSize(size), { source: size });
			}
			return state;
		});
		states.forEach((_, key) => !keys.has(key) && states.delete(key));
		return result;
	};

	const isResizable = (index: number) => !!panels[index] && panels[index].props?.resizable !== false;
	const isBarResizable = (index: number) => isResizable(index) && isResizable(index + 1);
	const isCollapsed = (index: number) => {
		const collapsible = collapsibles[index];
		return !!(collapsible?.start || collapsible?.end) && panelStates[index]?.value === 0;
	};
	const getPanelId = (index: number) => panels[index].props?.id ?? panelStates[index].id;

	const getPanelStyle = (index: number) => {
		const vnode = panels[index];
		const state = panelStates[index];
		const bars = panels.length - 1;
		// 折叠后不受 min 约束
		const min = isCollapsed(index) ? undefined : vnode.props?.min;
		const max = vnode.props?.max;
		return {
			flex: state.unit === 'auto' ? `${state.value} 1 0px` : `0 1 ${toLength(state, bars)}`,
			min: min === undefined ? undefined : toLength(parseSize(min), bars),
			max: max === undefined ? undefined : toLength(parseSize(max), bars)
		};
	};

	const toStyle = (style: ReturnType<typeof getPanelStyle>) => {
		const dimension = props.vertical ? 'Height' : 'Width';
		return { flex: style.flex, [`min${dimension}`]: style.min, [`max${dimension}`]: style.max };
	};

	/**
	 * 实测各面板与可分配的尺寸（容器内容区扣除分隔条）
	 * @returns ~
	 */
	const measure = () => {
		const el = current.value!;
		const vertical = props.vertical;
		const sizeOf = (node: Element) => node.getBoundingClientRect()[vertical ? 'height' : 'width'];
		const children = Array.from(el.children) as HTMLElement[];
		const elements = children.filter(i => i.classList.contains('vc-splitter-panel'));
		const bars = children.filter(i => i.classList.contains('vc-splitter__bar')).reduce((pre, i) => pre + sizeOf(i), 0);

		const style = window.getComputedStyle(el);
		const edges = vertical
			? ['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']
			: ['padding-left', 'padding-right', 'border-left-width', 'border-right-width'];
		const content = edges.reduce((pre, key) => pre - (Number.parseFloat(style.getPropertyValue(key)) || 0), sizeOf(el));
		return { elements, sizes: elements.map(sizeOf), available: Math.max(content - bars, 0) };
	};

	const toPercent = (size: number, available: number) => (available ? Math.round(size / available * 100) : 0);
	const getValues = (sizes: number[], available: number) => sizes.slice(0, -1).map(size => toPercent(size, available));

	// 聚焦时按实测刷新 aria-valuenow；没有变化时不重绘
	const refresh = () => {
		if (!current.value) return;
		const { sizes, available } = measure();
		const next = getValues(sizes, available);
		if (next.length === values.value.length && next.every((v, i) => v === values.value[i])) return;
		values.value = next;
	};

	/**
	 * 把尺寸写进各面板的状态：px 面板写像素，% 面板写百分比，未设的面板按像素比例更新权重
	 * @param sizes ~
	 * @param available ~
	 */
	const update = (sizes: number[], available: number) => {
		let autos = 0;
		let total = 0;
		panelStates.forEach((state, index) => {
			if (state.unit !== 'auto') return;
			autos++;
			total += sizes[index];
		});

		panelStates.forEach((state, index) => {
			const size = sizes[index];
			if (state.unit === 'px') {
				state.value = size;
			} else if (state.unit === '%') {
				state.value = available ? size / available * 100 : 0;
			} else {
				// 平均权重为 1：flex-grow 之和小于 1 时剩余空间分不完
				state.value = total ? size / total * autos : 0;
			}
		});
	};

	// 拖动中：直接写面板的样式与当前分隔条的 aria-valuenow，不重绘
	const write = (session: DragSession) => {
		session.elements.forEach((el, index) => {
			const style = toStyle(getPanelStyle(index));
			Object.keys(style).forEach(key => (el.style[key as any] = style[key] ?? ''));
			el.classList.toggle('is-collapsed', isCollapsed(index));
		});
		const { index, current: sizes, available } = session;
		session.bar.setAttribute('aria-valuenow', String(toPercent(sizes[index], available)));
	};

	/**
	 * 调整完成：更新状态，分隔条两侧按传入的单位回写 v-model（未设的面板回写百分比），并重绘
	 * @param session ~
	 * @param sizes ~
	 */
	const commit = (session: Session, sizes: number[]) => {
		const { index, available } = session;
		update(sizes, available);
		[index, index + 1].forEach((i) => {
			if (!panels[i]?.props?.['onUpdate:size']) return;
			const state = panelStates[i];
			const value = state.unit === 'px'
				? round(sizes[i])
				: `${round(available ? sizes[i] / available * 100 : 0)}%`;
			state.source = value;
			clones[i]?.component?.emit('update:size', value);
		});
		values.value = getValues(sizes, available);
	};

	/**
	 * 以分隔条 index 两侧的面板开始一次调整
	 * @param index ~
	 * @returns ~
	 */
	const createSession = (index: number): Session => {
		const { elements, sizes, available } = measure();
		const a = panels[index].props || {};
		const b = panels[index + 1].props || {};
		const total = sizes[index] + sizes[index + 1];
		const maxA = resolveSize(a.max, available) ?? Infinity;
		const maxB = resolveSize(b.max, available) ?? Infinity;
		const lower = Math.max(resolveSize(a.min, available) ?? 0, total - maxB, 0);
		const upper = Math.min(maxA, total - (resolveSize(b.min, available) ?? 0), total);
		return {
			index,
			elements,
			sizes,
			available,
			total,
			lower,
			upper,
			// 对侧面板能容下全部尺寸时才可吸附
			snapA: !!collapsibles[index]?.end && total <= maxB && lower > 0,
			snapB: !!collapsibles[index + 1]?.start && total <= maxA && upper < total
		};
	};

	/**
	 * 前一个面板设为 size，后一个面板补足；返回各面板尺寸
	 * @param session ~
	 * @param size ~
	 * @returns ~
	 */
	const getSizes = (session: Session, size: number) => {
		const { index, total } = session;
		const sizes = session.sizes.slice();
		sizes[index] = size;
		sizes[index + 1] = total - size;
		return sizes;
	};

	/**
	 * 一次调整结束：折叠状态有变化的面板记下折叠前尺寸，并发出 collapse-change
	 * @param session ~
	 * @param sizes ~
	 */
	const settle = (session: Session, sizes: number[]) => {
		[session.index, session.index + 1].forEach((index) => {
			const before = session.sizes[index];
			if (!before === !sizes[index]) return;
			sizes[index] || (panelStates[index].previous = before);
			emit('collapse-change', {
				index,
				collapsed: !sizes[index],
				sizes: sizes.slice()
			} satisfies SplitterCollapseChangePayload);
		});
	};

	const getPayload = (index: number, sizes: number[]): SplitterResizePayload => ({ index, sizes: sizes.slice() });

	const reset = () => {
		document.body.style.cursor = '';
		drag.value?.preview && (drag.value.preview.style.transform = '');
		drag.value = null;
	};

	// 按下的分隔条由 currentTarget 得到；拖动中不受理新的按下
	const handleStart = (e: Event, point: DragPoint) => {
		const bar = e.currentTarget as HTMLElement;
		const index = Number(bar.dataset.index);
		if (drag.value || !isBarResizable(index)) return false;

		const session = createSession(index);
		drag.value = {
			...session,
			start: props.vertical ? point.clientY : point.clientX,
			current: session.sizes,
			bar,
			preview: props.lazy ? bar.querySelector<HTMLElement>('.vc-splitter__preview') : null
		};
		document.body.style.cursor = props.vertical ? 'row-resize' : 'col-resize';
		emit('resize-start', getPayload(index, session.sizes));
	};

	const handleMove = (point: DragPoint) => {
		const session = drag.value;
		if (!session) return;
		const { index, sizes, lower, total, upper, snapA, snapB, preview } = session;
		const size = (props.vertical ? point.clientY : point.clientX) - session.start + sizes[index];
		const resolved = snapA && size < lower / 2
			? 0
			: snapB && size > upper + (total - upper) / 2
				? total
				: clamp(size, session);

		session.current = getSizes(session, resolved);
		if (props.lazy) {
			preview && (preview.style.transform = `translate${props.vertical ? 'Y' : 'X'}(${resolved - sizes[index]}px)`);
		} else {
			update(session.current, session.available);
			write(session);
		}
		emit('resize', getPayload(index, session.current));
	};

	const handleEnd = () => {
		const session = drag.value;
		if (!session) return;
		reset();
		session.current !== session.sizes && commit(session, session.current);
		emit('resize-end', getPayload(session.index, session.current));
		settle(session, session.current);
	};

	// 手势被打断（touchcancel、mouseup 丢失）：恢复拖动前的尺寸；lazy 时还没应用，不用恢复
	const handleCancel = () => {
		const session = drag.value;
		if (!session) return;
		reset();
		if (!props.lazy && session.current !== session.sizes) {
			update(session.sizes, session.available);
			write({ ...session, current: session.sizes });
		}
		emit('resize-end', getPayload(session.index, session.sizes));
	};

	const { listeners } = useDrag({
		selectable: false,
		start: handleStart,
		move: (_, point) => handleMove(point),
		end: handleEnd,
		cancel: handleCancel
	});

	/**
	 * 折叠 / 展开分隔条 index 一侧的面板 target；空间由另一侧补足或让出
	 * @param index 分隔条
	 * @param target 面板
	 */
	const toggle = (index: number, target: number) => {
		if (drag.value) return;
		const session = createSession(index);
		const { sizes, total, available } = session;
		const isA = target === index;
		let size: number;
		if (sizes[target]) {
			size = isA ? 0 : total;
		} else {
			// 恢复折叠前的尺寸；没有时取 min，再没有时两侧平分
			const restore = panelStates[target].previous || resolveSize(panels[target].props?.min, available) || total / 2;
			size = clamp(isA ? restore : total - restore, session);
		}
		const next = getSizes(session, size);
		commit(session, next);
		settle(session, next);
	};

	/**
	 * 分隔条上可用的折叠按钮：previous 收起前一个面板（或展开已折叠的后一个），next 反之
	 * @param index ~
	 * @returns ~
	 */
	const getActions = (index: number) => {
		const collapsedA = isCollapsed(index);
		const collapsedB = isCollapsed(index + 1);
		return {
			previous: collapsedB ? index + 1 : (collapsibles[index]?.end && !collapsedA ? index : -1),
			next: collapsedA ? index : (collapsibles[index + 1]?.start && !collapsedB ? index + 1 : -1)
		};
	};

	const handleKeydown = (e: KeyboardEvent) => {
		const index = Number((e.currentTarget as HTMLElement).dataset.index);
		if (drag.value) return;

		if (e.key === 'Enter') {
			// getActions 已让展开优先于收起
			const { previous, next } = getActions(index);
			const target = previous !== -1 ? previous : next;
			if (target === -1) return;
			e.preventDefault();
			toggle(index, target);
			return;
		}

		const [backward, forward] = props.vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
		if (![backward, forward, 'Home', 'End'].includes(e.key) || !isBarResizable(index)) return;
		e.preventDefault();

		const session = createSession(index);
		const size = session.sizes[index];
		// 键盘不吸附：方向键在 min 处停下，折叠用 Enter
		const resolved = clamp(
			e.key === 'Home' ? session.lower : e.key === 'End' ? session.upper : size + (e.key === forward ? STEP : -STEP),
			session
		);
		if (resolved === size) return;

		const sizes = getSizes(session, resolved);
		emit('resize-start', getPayload(index, session.sizes));
		commit(session, sizes);
		emit('resize', getPayload(index, sizes));
		emit('resize-end', getPayload(index, sizes));
	};

	const stopPropagation = (e: Event) => e.stopPropagation();

	const renderAction = (index: number, target: number, type: 'previous' | 'next') => {
		if (target === -1) return null;
		const vertical = props.vertical;
		const icon = type === 'previous' ? (vertical ? 'up' : 'left') : (vertical ? 'down' : 'right');
		return (
			<span
				class={['vc-splitter__collapse', `is-${type}`]}
				aria-hidden="true"
				onMousedown={stopPropagation}
				onTouchstart={stopPropagation}
				onClick={() => toggle(index, target)}
			>
				<Icon type={icon} />
			</span>
		);
	};

	const renderBar = (index: number, key: PropertyKey) => {
		const resizable = isBarResizable(index);
		const actions = getActions(index);
		const session = drag.value;
		const dragging = session?.index === index;
		return (
			<div
				key={`__bar_${String(key)}`}
				data-index={index}
				class={['vc-splitter__bar', { 'is-disabled': !resizable, 'is-dragging': dragging }]}
				role="separator"
				tabindex={resizable || actions.previous !== -1 || actions.next !== -1 ? 0 : undefined}
				aria-orientation={props.vertical ? 'horizontal' : 'vertical'}
				aria-valuemin={0}
				aria-valuemax={100}
				// 拖动中重绘时取当前的尺寸
				aria-valuenow={dragging ? toPercent(session.current[index], session.available) : values.value[index]}
				aria-controls={getPanelId(index)}
				aria-disabled={resizable ? undefined : 'true'}
				{...listeners}
				onKeydown={handleKeydown}
				onFocus={refresh}
			>
				{renderAction(index, actions.previous, 'previous')}
				{
					slots.handle
						? slots.handle({ index, vertical: props.vertical, dragging })
						: <div class="vc-splitter__handle" />
				}
				{renderAction(index, actions.next, 'next')}
				{props.lazy && <div class="vc-splitter__preview" />}
			</div>
		);
	};

	onMounted(() => nextTick(refresh));
	// 拖动中卸载：还原 body 的光标
	onBeforeUnmount(() => drag.value && reset());

	return () => {
		// 调整完成后 values 变化，触发重绘
		void values.value;

		panels = getChildren(slots.default?.(), [SplitterPanel]);
		panelStates = sync(panels);
		collapsibles = panels.map(vnode => getCollapsible(vnode.props?.collapsible));

		const children: VNode[] = [];
		clones = panels.map((vnode, index) => {
			const clone = cloneVNode(vnode, {
				id: getPanelId(index),
				class: { 'is-collapsed': isCollapsed(index) },
				style: toStyle(getPanelStyle(index))
			});
			index > 0 && children.push(renderBar(index - 1, vnode.key ?? `#${index}`));
			children.push(clone);
			return clone;
		});

		return h(props.tag, { ref: current, class: classes.value }, children);
	};
};
