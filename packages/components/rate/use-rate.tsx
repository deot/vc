/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { ref, computed, watch, inject } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import type { Props } from './rate-props';
import { Icon } from '../icon';

// 按下后移动超过该距离（px）算滑动，否则算点按
const TAP_THRESHOLD = 3;

/**
 * Rate 与 MRate 共用
 *
 * 分值由指针的横坐标决定：星星之间的间距归最近的星星，开启 half 时按星星左右两半取 x - 0.5 / x；
 * 鼠标悬停预览，按下后左右滑动连续改分，松开时生效；点按当前分值且 clearable 时清零
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param options ~
 * @param options.mobile 移动端（MRate）：根节点加标记类 vcm-rate，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useRate = (
	props: Props,
	{ slots, emit }: SetupContext<['update:modelValue', 'change']>,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-rate vcm-rate' : 'vc-rate';
	const formItem = inject<any>('vc-form-item', {});
	const starsRef = ref<HTMLElement>();
	const currentValue = ref(0);
	// 悬停与按下滑动时的预览值，null 表示没有预览
	const hoverValue = ref<number | null>(null);
	const dragValue = ref<number | null>(null);

	const interactive = computed(() => !props.disabled && !props.readonly);
	const displayValue = computed(() => dragValue.value ?? hoverValue.value ?? currentValue.value);

	watch(
		() => props.modelValue,
		(v) => {
			currentValue.value = +v || 0;
		},
		{ immediate: true }
	);

	const getTip = (value: number) => props.tooltip[Math.ceil(value) - 1];

	const sync = (value: number) => {
		if (value === currentValue.value) return;

		currentValue.value = value;
		const v = typeof props.modelValue === 'string' ? String(value) : value;
		emit('update:modelValue', v);
		emit('change', v);
		formItem.change?.(value);
	};

	/**
	 * 横坐标对应的分值：在第一颗星左侧为 0，在最后一颗星右侧为满分
	 * @param x clientX
	 * @returns ~
	 */
	const getValueByX = (x: number) => {
		const stars = starsRef.value?.children;
		if (!stars?.length) return 0;

		const rects = Array.from(stars, star => star.getBoundingClientRect());
		if (x < rects[0].left) return 0;

		for (let i = 0; i < rects.length; i++) {
			const rect = rects[i];
			const next = rects[i + 1];
			// 与下一颗星之间的间距按中线分给两边
			if (next && x >= (rect.right + next.left) / 2) continue;
			return props.half && x < rect.left + rect.width / 2 ? i + 0.5 : i + 1;
		}
		return rects.length;
	};

	let startX = 0;
	let moved = false;

	const drag = useDrag({
		start: (_, point: DragPoint) => {
			if (!interactive.value) return false;

			startX = point.clientX;
			moved = false;
			dragValue.value = getValueByX(point.clientX);
		},
		move: (_, point: DragPoint) => {
			moved = moved || Math.abs(point.clientX - startX) > TAP_THRESHOLD;
			dragValue.value = getValueByX(point.clientX);
		},
		end: (e) => {
			// 触摸松开后不再补发鼠标事件（否则按下与点按会再处理一遍）
			e.type === 'touchend' && e.cancelable && e.preventDefault();

			const value = dragValue.value!;
			dragValue.value = null;
			sync(!moved && props.clearable && value === currentValue.value ? 0 : value);
		},
		cancel: () => {
			dragValue.value = null;
		},
		selectable: false
	});

	const handleMousemove = (e: MouseEvent) => {
		if (!interactive.value || dragValue.value !== null) return;
		hoverValue.value = getValueByX(e.clientX);
	};

	const handleMouseleave = () => {
		hoverValue.value = null;
	};

	// 方向键每次 1 分（half 时 0.5），Home / End 到 0 与满分
	const handleKeydown = (e: KeyboardEvent) => {
		if (!interactive.value) return;

		const step = props.half ? 0.5 : 1;
		const value = currentValue.value;
		let next: number;
		switch (e.key) {
			case 'ArrowRight':
			case 'ArrowUp': next = value + step; break;
			case 'ArrowLeft':
			case 'ArrowDown': next = value - step; break;
			case 'Home': next = 0; break;
			case 'End': next = props.count; break;
			default: return;
		}

		e.preventDefault();
		// 非 half 下的小数分值先对齐到整数
		next = Math.round(next / step) * step;
		sync(Math.min(props.count, Math.max(0, next)));
	};

	const renderIcon = (index: number) => {
		if (slots.character) return slots.character({ index });
		if (props.character) return (<span>{props.character}</span>);
		return (<Icon type={props.icon} />);
	};

	return () => {
		const value = displayValue.value;
		const tip = props.tooltip.length ? getTip(currentValue.value) : undefined;

		return (
			<div
				class={[name, { 'is-disabled': props.disabled, 'is-readonly': props.readonly }]}
				style={props.color ? { '--vc-rate-color': props.color } : undefined}
				role="slider"
				tabindex={interactive.value ? 0 : -1}
				aria-valuemin={0}
				aria-valuemax={props.count}
				aria-valuenow={currentValue.value}
				aria-valuetext={tip === undefined ? undefined : String(tip)}
				aria-disabled={props.disabled}
				aria-readonly={props.readonly}
				onKeydown={handleKeydown}
			>
				<div
					ref={starsRef}
					class="vc-rate__stars"
					onMousemove={handleMousemove}
					onMouseleave={handleMouseleave}
					{...drag.listeners}
				>
					{
						Array.from({ length: props.count }, (_, index) => {
							const isSelect = value >= index + 1;
							// 非整数分值的小数部分统一显示为半星
							const isHalf = props.half && !isSelect && value > index;
							return (
								<div
									key={index}
									class={['vc-rate__star', { 'is-select': isSelect, 'is-half': isHalf }]}
									style={props.iconStyle}
								>
									<span class="vc-rate__icon">{renderIcon(index)}</span>
									{isHalf && (<span class="vc-rate__icon is-overlay">{renderIcon(index)}</span>)}
								</div>
							);
						})
					}
				</div>
				{
					!!props.tooltip.length && (
						<span class="vc-rate__tips">
							{
								slots.tip
									? slots.tip({ value })
									: getTip(value)
							}
						</span>
					)
				}
			</div>
		);
	};
};
