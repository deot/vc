/** @jsxImportSource vue */

import { computed, inject, ref, watch } from 'vue';
import type { SetupContext } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import type { Props, SliderValue } from './slider-props';
import { clamp, getMarks, getRanges, getTickValues, normalizeValue, snap, stepValue, toOffset, toValue } from './utils';
import type { FormItemProvide } from '../form/types';
import { InputNumber as DesktopInputNumber } from '../input';
import { Popover } from '../popover';

type Emits = ['update:modelValue', 'change', 'after-change'];

// 气泡不挂到 body，包含块只有滑块宽：按内容宽度排版，不被挤成多行（最大宽度仍由 Popover 按视口写入容器）
// 写在行内：气泡节点创建时就生效，不依赖后代选择器
const TOOLTIP_STYLE = { width: 'max-content' };

/**
 * Slider 与 MSlider 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.expose ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MSlider）：根节点加标记类 vcm-slider，尺寸由 mobile/style.scss 覆盖局部变量
 * @param options.InputNumber showInput 的输入框组件，MSlider 传入 MInputNumber（桌面端入口不引入移动端代码）
 * @returns render
 */
export const useSlider = (
	props: Props,
	{ emit, expose, slots }: SetupContext<Emits>,
	options: { mobile?: boolean; InputNumber?: typeof DesktopInputNumber } = {}
) => {
	const InputNumber = options.InputNumber || DesktopInputNumber;
	const formItem = inject('vc-form-item', {} as FormItemProvide);
	const slider = ref<HTMLElement>();
	const thumbs: HTMLElement[] = [];
	const currentValue = ref<number[]>([props.min]);
	// 正在拖动的滑块下标，-1 表示没有
	const dragIndex = ref(-1);
	const dragging = ref(false);
	// 正在整体平移选中条
	const barDragging = ref(false);
	// 悬停、聚焦或拖动中的滑块
	const activeTips = ref<Record<number, boolean>>({});

	let rect: DOMRect | undefined;
	// 按下时指针与滑块中心的距离（轨道比例），拖动时扣除，避免滑块跳到指针下
	let grabOffset = 0;
	// 平移选中条：按下时的指针比例与各值
	let barStart = { ratio: 0, values: [] as number[] };
	// 平移选中条后松开会再触发一次 click，跳过它
	let skipClick = false;
	// 当前拖动由触摸发起：触屏没有悬停，松开后气泡一律收起
	let touching = false;

	const isRange = computed(() => !!props.range);
	const barDraggable = computed(() => typeof props.range === 'object' && !!props.range.draggable);

	const step = computed(() => (props.step === null ? null : Math.abs(props.step) || 1));
	const ranges = computed(() => getRanges({
		min: props.min,
		max: props.max,
		step: step.value || 1,
		segments: props.segments
	}));
	const marks = computed(() => getMarks(props.marks, props.min, props.max));
	const markValues = computed(() => marks.value.map(item => item.value));
	const snapOptions = computed(() => ({ ranges: ranges.value, step: step.value, marks: markValues.value }));
	// 单值显示一个输入框，两个滑块的范围显示两个；只能选标签值时不显示
	const showInput = computed(() => {
		return props.showInput && step.value !== null && (!isRange.value || currentValue.value.length === 2);
	});

	// 起点所在的边
	const startSide = computed(() => {
		return props.vertical
			? (props.inverted ? 'top' : 'bottom')
			: (props.inverted ? 'right' : 'left');
	});

	const classes = computed(() => {
		return [
			'vc-slider',
			{
				'vcm-slider': !!options.mobile,
				'is-vertical': props.vertical,
				'is-inverted': props.inverted,
				'is-marked': marks.value.length > 0,
				'is-slider-input': showInput.value,
				'is-slider-disabled': props.disabled
			}
		];
	});

	const offsets = computed(() => currentValue.value.map(value => toOffset(value, ranges.value)));

	const getPositionStyle = (offset: number) => ({ [startSide.value]: `${offset * 100}%` });

	const barStyle = computed(() => {
		const start = isRange.value ? offsets.value[0] : 0;
		const end = offsets.value[offsets.value.length - 1];

		return {
			...getPositionStyle(start),
			[props.vertical ? 'height' : 'width']: `${(end - start) * 100}%`
		};
	});

	// 与标签重合的刻度由标签圆点代替
	const ticks = computed(() => {
		if (props.ticks === 'none') return [];

		const exclude = new Set(markValues.value);
		return getTickValues(snapOptions.value)
			.filter(value => !exclude.has(value))
			.map(value => ({ value, offset: toOffset(value, ranges.value) }));
	});

	const markItems = computed(() => marks.value.map(item => ({ ...item, offset: toOffset(item.value, ranges.value) })));

	// 是否落在选中范围内
	const isActive = (value: number) => {
		const values = currentValue.value;
		return value <= values[values.length - 1] && (!isRange.value || value >= values[0]);
	};

	const placement = computed(() => props.tooltipPlacement || (props.vertical ? 'right' : 'top'));

	const getTip = (index: number) => props.formatter(currentValue.value[index]);
	const hasContent = (content: unknown) => content !== null && content !== undefined && content !== '';
	const isTipVisible = (index: number) => {
		if (props.tooltip === 'never') return false;
		return (props.tooltip === 'always' || !!activeTips.value[index]) && (!!slots.tooltip || hasContent(getTip(index)));
	};

	const reset = (value: SliderValue) => {
		currentValue.value = normalizeValue(value, {
			min: props.min,
			max: props.max,
			range: isRange.value
		});
	};

	const getOutputValue = () => {
		return isRange.value ? [...currentValue.value] : currentValue.value[0];
	};

	const sync = (type: 'change' | 'after-change') => {
		const value = getOutputValue();
		emit(type, value, reset);

		if (type === 'change') {
			emit('update:modelValue', value, reset);
		}

		formItem[type === 'after-change' ? 'blur' : 'change']?.(value);
	};

	const setValues = (nextValue: number[]) => {
		if (nextValue.every((item, i) => item === currentValue.value[i])) return false;

		currentValue.value = nextValue;
		sync('change');
		return true;
	};

	// 越过相邻滑块时把它们一起推到同一个值
	const setValue = (index: number, value: number) => {
		return setValues(currentValue.value.map((item, i) => {
			if (i === index) return value;
			return i < index ? Math.min(item, value) : Math.max(item, value);
		}));
	};

	const measure = () => {
		rect = slider.value?.getBoundingClientRect();
		const size = rect && (props.vertical ? rect.height : rect.width);
		return !!size && props.max > props.min;
	};

	// 指针在轨道上的比例，起点为 0
	const getRatio = (point: { clientX: number; clientY: number }) => {
		if (!rect) return 0;

		const ratio = props.vertical
			? (rect.bottom - point.clientY) / rect.height
			: (point.clientX - rect.left) / rect.width;
		return props.inverted ? 1 - ratio : ratio;
	};

	const getValueByRatio = (ratio: number) => snap(toValue(ratio, ranges.value), snapOptions.value);

	const handleInputChange = (index: number, value: number | string) => {
		const inputValue = value === 0 ? 0 : Number(value || props.min);
		setValue(index, clamp(inputValue, props.min, props.max));
	};

	// 值相同的滑块中：点在它们前面动下标最小的，后面动下标最大的
	const getNearestIndex = (value: number) => {
		let index = 0;
		currentValue.value.forEach((item, i) => {
			const distance = Math.abs(item - value);
			const nearest = Math.abs(currentValue.value[index] - value);
			if (distance < nearest || (distance === nearest && value > item)) index = i;
		});
		return index;
	};

	const handleSliderClick = (event: MouseEvent) => {
		if (skipClick) {
			skipClick = false;
			return;
		}
		if (props.disabled || !props.clickable) return;
		if ((event.target as HTMLElement).closest('.vc-slider__btn-wrapper')) return;
		if (!measure()) return;

		const value = getValueByRatio(getRatio(event));
		setValue(isRange.value ? getNearestIndex(value) : 0, value);
	};

	const handleMarkClick = (e: MouseEvent, value: number) => {
		e.stopPropagation();
		if (props.disabled || !props.clickable) return;

		setValue(isRange.value ? getNearestIndex(value) : 0, value);
	};

	const handleDragStart = (e: MouseEvent | TouchEvent, point: DragPoint) => {
		if (props.disabled) return false;

		const index = Number((e.currentTarget as HTMLElement).dataset.index);
		touching = e.type.startsWith('touch');
		dragIndex.value = index;
		dragging.value = false;
		// 鼠标按下时气泡已由悬停显示；触摸点按后浏览器会补发 mousedown，此时不显示，留到真正拖动时
		touching && (activeTips.value[index] = true);
		grabOffset = measure() ? getRatio(point) - offsets.value[index] : 0;
	};

	const handleDrag = (point: DragPoint) => {
		if (dragIndex.value === -1 || !measure()) return;

		dragging.value = true;
		activeTips.value[dragIndex.value] = true;
		setValue(dragIndex.value, getValueByRatio(getRatio(point) - grabOffset));
	};

	// 值随拖动即时生效，手势被打断（touchcancel、mouseup 丢失）时与松开同样处理
	const handleDragEnd = () => {
		const index = dragIndex.value;
		if (dragging.value && index !== -1) {
			dragging.value = false;
			activeTips.value[index] = false;
			thumbs[index]?.blur();
			sync('after-change');
		} else if (touching && index !== -1) {
			// 触摸点按（未拖动）：同样收起气泡、取消聚焦
			activeTips.value[index] = false;
			thumbs[index]?.blur();
		}

		touching = false;
		dragIndex.value = -1;
	};

	const drag = useDrag({
		start: handleDragStart,
		move: (_, point) => handleDrag(point),
		end: handleDragEnd
	});

	const setTipActive = (index: number, value: boolean) => {
		activeTips.value[index] = value;
	};

	const setAllTipsActive = (value: boolean) => {
		currentValue.value.forEach((_, index) => setTipActive(index, value));
	};

	const handleBarDragStart = (_: Event, point: DragPoint) => {
		if (props.disabled || !barDraggable.value || !measure()) return false;

		barStart = { ratio: getRatio(point), values: [...currentValue.value] };
		barDragging.value = false;
	};

	// 位移按对齐后的值计算，并限制在首尾都不越界的范围内
	const handleBarDrag = (point: DragPoint) => {
		if (!measure()) return;

		const { values } = barStart;
		const delta = clamp(
			getValueByRatio(getRatio(point)) - getValueByRatio(barStart.ratio),
			props.min - values[0],
			props.max - values[values.length - 1]
		);

		if (!barDragging.value && !delta) return;
		if (!barDragging.value) {
			barDragging.value = true;
			setAllTipsActive(true);
		}
		setValues(values.map(item => snap(item + delta, snapOptions.value)));
	};

	const handleBarDragEnd = () => {
		if (!barDragging.value) return;

		barDragging.value = false;
		setAllTipsActive(false);
		skipClick = true;
		// 松开在选中条之外时不会有 click，下一轮事件循环前复位
		setTimeout(() => { skipClick = false; });
		sync('after-change');
	};

	const barDrag = useDrag({
		start: handleBarDragStart,
		move: (_, point) => handleBarDrag(point),
		end: handleBarDragEnd,
		selectable: false
	});

	// 方向键按视觉方向移动；PageUp / PageDown 十步；Home / End 到相邻滑块或边界
	const handleKeydown = (e: KeyboardEvent, index: number) => {
		if (props.disabled) return;

		const values = currentValue.value;
		const value = values[index];
		// 视觉上向右或向上对应的值方向
		const right = !props.vertical && props.inverted ? -1 : 1;
		const up = props.vertical && props.inverted ? -1 : 1;
		const move = (direction: 1 | -1, times = 1) => {
			let next = value;
			for (let i = 0; i < times; i++) next = stepValue(next, direction, snapOptions.value);
			return next;
		};

		let next: number;
		switch (e.key) {
			case 'ArrowRight': next = move(right); break;
			case 'ArrowLeft': next = move(-right as 1 | -1); break;
			case 'ArrowUp': next = move(up); break;
			case 'ArrowDown': next = move(-up as 1 | -1); break;
			case 'PageUp': next = move(1, 10); break;
			case 'PageDown': next = move(-1, 10); break;
			case 'Home': next = values[index - 1] ?? props.min; break;
			case 'End': next = values[index + 1] ?? props.max; break;
			default: return;
		}

		e.preventDefault();
		// 键盘操作时显示气泡（鼠标点按获得的焦点不显示，之后改用键盘时在这里补上），失焦时收起
		setTipActive(index, true);
		setValue(index, next) && sync('after-change');
	};

	// 悬停只认鼠标（触摸点按后浏览器补发的 mouseenter 不算）；聚焦只认键盘（:focus-visible），鼠标、触摸点按获得的焦点不显示气泡
	const handleEnter = (index: number) => {
		dragIndex.value === -1 && setTipActive(index, true);
	};

	const handleLeave = (index: number) => {
		dragIndex.value === -1 && setTipActive(index, false);
	};

	watch(
		() => [props.modelValue, props.min, props.max, isRange.value] as const,
		() => {
			const nextValue = normalizeValue(props.modelValue, {
				min: props.min,
				max: props.max,
				range: isRange.value
			});

			if (
				nextValue.length !== currentValue.value.length
				|| nextValue.some((item, i) => item !== currentValue.value[i])
			) {
				currentValue.value = nextValue;
			}
		},
		{ immediate: true }
	);

	expose({ reset });

	const renderThumb = (_: number, index: number) => {
		return (
			<div
				key={index}
				data-index={index}
				style={getPositionStyle(offsets.value[index])}
				class="vc-slider__btn-wrapper"
				{...drag.listeners}
			>
				<Popover
					modelValue={isTipVisible(index)}
					always={props.tooltip === 'always'}
					portal={false}
					trigger="custom"
					placement={placement.value}
					theme="dark"
					tag="div"
					portalStyle={TOOLTIP_STYLE}
					v-slots={{
						default: () => (
							<div
								ref={(el) => { thumbs[index] = el as HTMLElement; }}
								class={[
									'vc-slider__button',
									{
										'is-custom': !!slots.thumb,
										'is-dragging': dragIndex.value === index
									}
								]}
								role="slider"
								tabindex={props.disabled ? -1 : 0}
								aria-valuemin={props.min}
								aria-valuemax={props.max}
								aria-valuenow={currentValue.value[index]}
								aria-valuetext={getValueText(index)}
								aria-orientation={props.vertical ? 'vertical' : 'horizontal'}
								aria-disabled={props.disabled}
								onKeydown={(e: KeyboardEvent) => handleKeydown(e, index)}
								onFocus={(e: FocusEvent) => (e.target as HTMLElement).matches(':focus-visible') && setTipActive(index, true)}
								onBlur={() => setTipActive(index, false)}
								onPointerenter={(e: PointerEvent) => e.pointerType !== 'touch' && handleEnter(index)}
								onPointerleave={(e: PointerEvent) => e.pointerType !== 'touch' && handleLeave(index)}
							>
								{
									slots.thumb?.({
										value: currentValue.value[index],
										index,
										dragging: dragIndex.value === index
									})
								}
							</div>
						),
						content: () => (
							slots.tooltip
								? slots.tooltip({ value: currentValue.value[index], index })
								: getTip(index)
						)
					}}
				/>
			</div>
		);
	};

	const getValueText = (index: number) => {
		const tip = getTip(index);
		return typeof tip === 'string' || typeof tip === 'number' ? String(tip) : undefined;
	};

	// 两个输入框分列轨道两端、各自靠近对应的滑块：DOM 顺序为水平从左到右、垂直从上到下
	const inputOrder = computed<[number | null, number | null]>(() => {
		if (!showInput.value) return [null, null];
		if (!isRange.value) return [null, 0];

		const reversed = props.vertical ? !props.inverted : props.inverted;
		return reversed ? [1, 0] : [0, 1];
	});

	const renderInput = (index: number | null, position: 'before' | 'after') => {
		if (index === null) return;
		return (
			<InputNumber
				class={['vc-slider__input', `is-${position}`]}
				{...{
					min: props.min,
					max: props.max,
					step: step.value!,
					modelValue: String(currentValue.value[index]),
					disabled: props.disabled,
					onInput: (value: number | string) => handleInputChange(index, value)
				}}
			/>
		);
	};

	const renderTicks = () => {
		return ticks.value.map(({ value, offset }) => (
			<div
				key={value}
				style={getPositionStyle(offset)}
				class={['vc-slider__tick', `is-${props.ticks}`, { 'is-active': isActive(value) }]}
			/>
		));
	};

	const renderMarks = () => {
		return markItems.value.map((item) => {
			const active = isActive(item.value);
			const position = getPositionStyle(item.offset);
			const label = slots.mark
				? slots.mark({ value: item.value, label: item.label, active })
				: item.label;

			return [
				<div
					key={`dot-${item.value}`}
					style={position}
					class={['vc-slider__mark-dot', { 'is-active': active }]}
					onClick={(e: MouseEvent) => handleMarkClick(e, item.value)}
				/>,
				(slots.mark || hasContent(item.label)) && (
					<div
						key={`label-${item.value}`}
						style={[position, item.style]}
						class={['vc-slider__mark', item.class, { 'is-active': active }]}
						onClick={(e: MouseEvent) => handleMarkClick(e, item.value)}
					>
						{ label }
					</div>
				)
			];
		});
	};

	return () => {
		return (
			<div class={classes.value}>
				{ renderInput(inputOrder.value[0], 'before') }
				<div
					ref={slider}
					class={[
						'vc-slider__wrapper',
						{ 'is-clickable': props.clickable && !props.disabled }
					]}
					onClick={handleSliderClick}
				>
					<div
						style={barStyle.value}
						class={[
							'vc-slider__bar',
							{
								'is-draggable': barDraggable.value && !props.disabled,
								'is-dragging': barDragging.value
							}
						]}
						{...barDrag.listeners}
					/>
					{ renderTicks() }
					{ renderMarks() }
					{ currentValue.value.map(renderThumb) }
				</div>
				{ renderInput(inputOrder.value[1], 'after') }
			</div>
		);
	};
};
