/** @jsxImportSource vue */

import { computed, defineComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as sliderProps } from './slider-props';
import type { SliderButtonType, SliderValue } from './slider-props';
import { checkLimits, getDecimalLength, getOffset, getPointerX } from './utils';
import type { FormItemProvide } from '../form/types';
import { InputNumber } from '../input';
import { Popover } from '../popover';

const COMPONENT_NAME = 'vc-slider';

export const Slider = defineComponent({
	name: COMPONENT_NAME,
	props: sliderProps,
	emits: ['update:modelValue', 'change', 'after-change'],
	setup(props, { emit, expose }) {
		const formItem = inject('vc-form-item', {} as FormItemProvide);
		const slider = ref<HTMLElement>();
		const minPoint = ref<HTMLElement>();
		const maxPoint = ref<HTMLElement>();
		const currentValue = ref<[number, number]>([props.min, props.min]);
		const dragging = ref(false);
		const pointerDown = ref<SliderButtonType | ''>('');
		const startX = ref(0);
		const currentX = ref(0);
		const startPos = ref(0);
		const sliderWidth = ref(0);
		const minVisible = ref(props.showTip === 'always');
		const maxVisible = ref(props.showTip === 'always');

		const normalizedStep = computed(() => Math.abs(props.step) || 1);
		const valueRange = computed(() => Math.max(props.max - props.min, 0));

		const classes = computed(() => {
			return [
				'vc-slider',
				{
					'is-slider-input': props.showInput && !props.range,
					'is-slider-disabled': props.disabled
				}
			];
		});

		const minButtonClasses = computed(() => {
			return [
				'vc-slider__button',
				{ 'is-dragging': pointerDown.value === 'min' }
			];
		});

		const maxButtonClasses = computed(() => {
			return [
				'vc-slider__button',
				{ 'is-dragging': pointerDown.value === 'max' }
			];
		});

		const exportValue = computed<[number, number]>(() => {
			const decimalCases = getDecimalLength(normalizedStep.value);
			return currentValue.value.map(value => Number(value.toFixed(decimalCases))) as [number, number];
		});

		const getPercent = (value: number) => {
			if (!valueRange.value) return 0;
			return ((value - props.min) / valueRange.value) * 100;
		};

		const minPosition = computed(() => getPercent(currentValue.value[0]));
		const maxPosition = computed(() => getPercent(currentValue.value[1]));

		const barStyle = computed(() => {
			if (props.range) {
				return {
					left: `${minPosition.value}%`,
					width: `${maxPosition.value - minPosition.value}%`
				};
			}

			return {
				width: `${minPosition.value}%`
			};
		});

		const stops = computed(() => {
			if (!valueRange.value || !normalizedStep.value) return [];

			const stopCount = valueRange.value / normalizedStep.value;
			const stepWidth = (normalizedStep.value / valueRange.value) * 100;
			const result: number[] = [];

			for (let i = 1; i < stopCount; i++) {
				result.push(i * stepWidth);
			}

			return result;
		});

		const minTip = computed(() => props.formatter(exportValue.value[0]));
		const maxTip = computed(() => props.formatter(exportValue.value[1]));
		const hasTipContent = (content: unknown) => content !== null && content !== undefined && content !== '';
		const minPopoverVisible = computed(() => props.showTip !== 'never' && minVisible.value && hasTipContent(minTip.value));
		const maxPopoverVisible = computed(() => props.showTip !== 'never' && maxVisible.value && hasTipContent(maxTip.value));

		const getVisibleRef = (type: SliderButtonType) => {
			return type === 'min' ? minVisible : maxVisible;
		};

		const getPointRef = (type: SliderButtonType) => {
			return type === 'min' ? minPoint : maxPoint;
		};

		const getPositionRef = (type: SliderButtonType) => {
			return type === 'min' ? minPosition : maxPosition;
		};

		const getSliderWidth = () => {
			const element = slider.value;
			if (!element) return 0;

			const rect = element.getBoundingClientRect();
			return rect.width || element.clientWidth || element.offsetWidth || 0;
		};

		const handleSetSliderWidth = () => {
			sliderWidth.value = getSliderWidth();
		};

		const reset = (value: SliderValue) => {
			currentValue.value = checkLimits(value, {
				min: props.min,
				max: props.max
			});
		};

		const getOutputValue = () => {
			return props.range ? [...exportValue.value] : exportValue.value[0];
		};

		const sync = (type: 'change' | 'after-change') => {
			const value = getOutputValue();
			emit(type, value, reset);

			if (type === 'change') {
				emit('update:modelValue', value, reset);
			}

			formItem[type === 'after-change' ? 'blur' : 'change']?.(value);
		};

		const changeButtonPosition = (position: number, forceType?: SliderButtonType) => {
			const type = forceType || pointerDown.value;
			if (!type) return;

			const index = type === 'min' ? 0 : 1;
			const limitedValue = type === 'min'
				? checkLimits([position, props.max], { min: props.min, max: props.max })[0]
				: checkLimits([props.min, position], { min: props.min, max: props.max })[1];
			const nextValue = [...currentValue.value] as [number, number];

			nextValue[index] = limitedValue - getOffset(limitedValue, normalizedStep.value);

			if (props.range) {
				if (type === 'min' && nextValue[0] > nextValue[1]) nextValue[1] = nextValue[0];
				if (type === 'max' && nextValue[0] > nextValue[1]) nextValue[0] = nextValue[1];
			}

			reset(nextValue);
			sync('change');
		};

		const handleInputChange = (value: number | string) => {
			const inputValue = value === 0 ? 0 : Number(value || props.min);
			const nextValue = Math.min(props.max, Math.max(props.min, Number.isNaN(inputValue) ? props.min : inputValue));

			currentValue.value = [nextValue, currentValue.value[1]];
			sync('change');
		};

		const handleSliderClick = (event: MouseEvent | TouchEvent) => {
			if (props.disabled || !props.clickable || !slider.value) return;

			handleSetSliderWidth();
			if (!sliderWidth.value || !valueRange.value) return;

			const currentPointerX = getPointerX(event);
			const sliderOffsetLeft = slider.value.getBoundingClientRect().left;
			const newPosition = (((currentPointerX - sliderOffsetLeft) / sliderWidth.value) * valueRange.value) + props.min;
			const percentPosition = (newPosition / valueRange.value) * 100;

			if (!props.range || percentPosition <= minPosition.value) {
				changeButtonPosition(newPosition, 'min');
			} else if (percentPosition >= maxPosition.value) {
				changeButtonPosition(newPosition, 'max');
			} else {
				const type = (newPosition - currentValue.value[0]) <= (currentValue.value[1] - newPosition) ? 'min' : 'max';
				changeButtonPosition(newPosition, type);
			}
		};

		const handlePointerDragStart = (event: MouseEvent | TouchEvent, type: SliderButtonType) => {
			dragging.value = false;
			handleSetSliderWidth();
			startX.value = getPointerX(event);
			startPos.value = ((getPositionRef(type).value * valueRange.value) / 100) + props.min;
		};

		const handlePointerDrag = (event: MouseEvent | TouchEvent) => {
			if (!pointerDown.value || !sliderWidth.value || !valueRange.value) return;

			dragging.value = true;
			currentX.value = getPointerX(event);

			const diff = ((currentX.value - startX.value) / sliderWidth.value) * valueRange.value;
			changeButtonPosition(startPos.value + diff);
		};

		const removeDragEvents = () => {
			window.removeEventListener('mousemove', handlePointerDrag as EventListener);
			window.removeEventListener('touchmove', handlePointerDrag as EventListener);
			window.removeEventListener('mouseup', handlePointerDragEnd);
			window.removeEventListener('touchend', handlePointerDragEnd);
		};

		const handlePointerDragEnd = () => {
			if (dragging.value && pointerDown.value) {
				dragging.value = false;
				getVisibleRef(pointerDown.value).value = props.showTip === 'always';
				getPointRef(pointerDown.value).value?.blur();
				sync('after-change');
			}

			pointerDown.value = '';
			removeDragEvents();
		};

		const handlePointerDown = (event: MouseEvent | TouchEvent, type: SliderButtonType) => {
			if (props.disabled) return;

			pointerDown.value = type;
			getVisibleRef(type).value = props.showTip !== 'never';
			handlePointerDragStart(event, type);

			window.addEventListener('mousemove', handlePointerDrag as EventListener);
			window.addEventListener('touchmove', handlePointerDrag as EventListener);
			window.addEventListener('mouseup', handlePointerDragEnd);
			window.addEventListener('touchend', handlePointerDragEnd);
		};

		const handleFocus = (type: SliderButtonType) => {
			getVisibleRef(type).value = props.showTip !== 'never';
		};

		const handleBlur = (type: SliderButtonType) => {
			getVisibleRef(type).value = props.showTip === 'always';
		};

		const handleEnter = (type: SliderButtonType) => {
			if (!pointerDown.value) {
				handleFocus(type);
			}
		};

		const handleLeave = (type: SliderButtonType) => {
			if (!pointerDown.value) {
				handleBlur(type);
			}
		};

		watch(
			() => [props.modelValue, props.min, props.max, props.range] as const,
			() => {
				const nextValue = checkLimits(props.modelValue, {
					min: props.min,
					max: props.max
				});

				if (
					nextValue[0] !== currentValue.value[0]
					|| nextValue[1] !== currentValue.value[1]
				) {
					currentValue.value = nextValue;
				}
			},
			{ immediate: true }
		);

		watch(
			() => props.showTip,
			(value) => {
				if (value === 'always') {
					minVisible.value = true;
					maxVisible.value = true;
				} else if (value === 'never') {
					minVisible.value = false;
					maxVisible.value = false;
				}
			}
		);

		onMounted(() => {
			nextTick(handleSetSliderWidth);
			slider.value && Resize.on(slider.value, handleSetSliderWidth);
		});

		onBeforeUnmount(() => {
			slider.value && Resize.off(slider.value, handleSetSliderWidth);
			removeDragEvents();
		});

		expose({
			reset,
			refresh: handleSetSliderWidth,
			handleInputChange,
			currentValue,
			dragging,
			pointerDown,
			sliderWidth,
			minVisible,
			maxVisible
		});

		const renderButton = (type: SliderButtonType) => {
			const isMin = type === 'min';
			const visible = isMin ? minPopoverVisible.value : maxPopoverVisible.value;
			const tip = isMin ? minTip.value : maxTip.value;

			return (
				<Popover
					modelValue={visible}
					always={props.showTip === 'always'}
					portal={false}
					trigger="custom"
					placement="top"
					theme="dark"
					tag="div"
					v-slots={{
						default: () => (
							<div
								ref={isMin ? minPoint : maxPoint}
								class={isMin ? minButtonClasses.value : maxButtonClasses.value}
								tabindex={0}
								onFocus={() => handleFocus(type)}
								onBlur={() => handleBlur(type)}
								onMouseenter={() => handleEnter(type)}
								onMouseleave={() => handleLeave(type)}
							/>
						),
						content: () => tip
					}}
				/>
			);
		};

		return () => {
			return (
				<div class={classes.value}>
					<div
						ref={slider}
						class={[
							'vc-slider__wrapper',
							{ 'is-clickable': props.clickable && !props.disabled }
						]}
						onClick={(event: MouseEvent) => {
							if (event.target === event.currentTarget) {
								handleSliderClick(event);
							}
						}}
					>
						{
							props.showStops && stops.value.map(item => (
								<div
									key={item}
									style={{ left: `${item}%` }}
									class="vc-slider__stop"
									onClick={(event: MouseEvent) => {
										if (event.target === event.currentTarget) {
											handleSliderClick(event);
										}
									}}
								/>
							))
						}
						<div
							style={barStyle.value}
							class="vc-slider__bar"
							onClick={(event: MouseEvent) => {
								if (event.target === event.currentTarget) {
									handleSliderClick(event);
								}
							}}
						/>
						<div
							style={{ left: `${minPosition.value}%` }}
							class="vc-slider__btn-wrapper"
							onTouchstart={(event: TouchEvent) => handlePointerDown(event, 'min')}
							onMousedown={(event: MouseEvent) => handlePointerDown(event, 'min')}
						>
							{ renderButton('min') }
						</div>
						{
							props.range && (
								<div
									style={{ left: `${maxPosition.value}%` }}
									class="vc-slider__btn-wrapper"
									onTouchstart={(event: TouchEvent) => handlePointerDown(event, 'max')}
									onMousedown={(event: MouseEvent) => handlePointerDown(event, 'max')}
								>
									{ renderButton('max') }
								</div>
							)
						}
					</div>
					{
						!props.range && props.showInput && (
							<InputNumber
								{...{
									min: props.min,
									max: props.max,
									step: props.step,
									modelValue: String(exportValue.value[0]),
									disabled: props.disabled,
									onInput: handleInputChange
								}}
							/>
						)
					}
				</div>
			);
		};
	}
});
