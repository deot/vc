/** @jsxImportSource vue */

import { defineComponent, ref, computed, withModifiers } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { throttle } from 'lodash-es';
import { Icon } from '../icon';
import { TransitionSlide } from '../transition';
import { useCarousel } from './use-carousel';

import { props as carouselProps } from './carousel-props';

const COMPONENT_NAME = 'vc-carousel';

export const Carousel = defineComponent({
	name: COMPONENT_NAME,
	props: carouselProps,
	setup(props, { slots, expose }) {
		const isHover = ref(false);
		const wrapper = ref<HTMLElement | null>(null);
		const content = ref<HTMLElement | null>(null);
		const arrowDisplay = computed(() => {
			return props.arrow && !props.vertical;
		});

		const carousel = useCarousel(wrapper, content, expose);
		const itemInStage = (item: ComponentInternalInstance, index: number, items: ComponentInternalInstance[]) => {
			const length = items.length;
			const isInStage = item.exposed!.isInStage.value;

			if ((index === length - 1 && isInStage && items[0].exposed!.isActive.value)
				|| (isInStage && items[index + 1] && items[index + 1].exposed!.isActive.value)
			) {
				return 'left';
			} else if ((index === 0 && isInStage && items[length - 1].exposed!.isActive.value)
				|| (isInStage && items[index - 1] && items[index - 1].exposed!.isActive.value)) {
				return 'right';
			}
			return false;
		};

		const handleButtonEnter = (arrow: string) => {
			if (props.vertical) return;
			carousel.items.value.forEach((item: ComponentInternalInstance, index: number, items: ComponentInternalInstance[]) => {
				if (arrow === itemInStage(item, index, items)) {
					item.exposed!.isHover.value = true;
				}
			});
		};

		const handleButtonLeave = () => {
			if (props.vertical) return;
			carousel.items.value.forEach((item) => {
				item.exposed!.isHover.value = false;
			});
		};

		const handleDotHover = (index: number) => {
			if (props.trigger === 'hover' && index !== carousel.activeIndex.value) {
				carousel.activeIndex.value = index;
			}
		};

		const handleMouseEnter = () => {
			isHover.value = true;
			carousel.pauseTimer();
		};

		const handleMouseLeave = () => {
			isHover.value = false;
			carousel.startTimer();
		};

		const throttledArrowClick = throttle(carousel.setActiveItem);
		const throttledDotHover = throttle(handleDotHover);
		return () => {
			return (
				<div
					ref={wrapper}
					class={['vc-carousel', `is-${carousel.direction.value}`]}
					onMousedown={withModifiers(carousel.handleStart, ['stop', 'prevent'])}
					onMousemove={withModifiers(carousel.handleMove, ['stop', 'prevent'])}
					onMouseup={withModifiers(carousel.handleEnd, ['stop', 'prevent'])}
					onMouseenter={withModifiers(handleMouseEnter, ['stop'])}
					onMouseleave={withModifiers(handleMouseLeave, ['stop'])}
				>
					<div
						ref={content}
						class="vc-carousel__wrapper"
						style={{ height: props.height ? `${props.height}px` : 'auto' }}
					>
						{
							arrowDisplay.value && (
								<TransitionSlide mode="left-part">
									<button
										// @ts-ignore
										vShow={(props.arrow === 'always' || isHover.value) && (props.loop || carousel.activeIndex.value > 0)}
										type="button"
										class="vc-carousel__arrow is-left-arrow"
										onMouseenter={() => handleButtonEnter('left')}
										onMouseleave={handleButtonLeave}
										onClick={withModifiers(() => throttledArrowClick(carousel.activeIndex.value - 1), ['stop'])}
									>
										<Icon type="left" />
									</button>
								</TransitionSlide>
							)
						}
						{
							arrowDisplay.value && (
								<TransitionSlide mode="right-part">
									<button
										// @ts-ignore
										vShow={(
											(props.arrow === 'always' || isHover.value)
											&& (props.loop || carousel.activeIndex.value < carousel.items.value.length - 1)
										)}
										type="button"
										class="vc-carousel__arrow is-right-arrow"
										onMouseenter={() => handleButtonEnter('right')}
										onMouseleave={handleButtonLeave}
										onClick={withModifiers(() => throttledArrowClick(carousel.activeIndex.value + 1), ['stop'])}
									>
										<Icon type="right" />
									</button>
								</TransitionSlide>
							)
						}
						{slots.default?.()}
					</div>
					{
						props.dots && (
							<ul class={['vc-carousel__dots', ...carousel.dotsClasses.value]}>
								{carousel.items.value.map((item, index) => (
									<li
										key={index}
										class={[
											'vc-carousel__dot',
											`is-${carousel.direction.value}`,
											{ 'is-active': index === carousel.activeIndex.value }
										]}
										onMouseenter={() => throttledDotHover(index)}
										onClick={() => carousel.handleDotClick(index)}
									>
										<button class="vc-carousel__button">
											{carousel.hasLabel.value && <span>{(item.props as any).label}</span>}
										</button>
									</li>
								))}
							</ul>
						)
					}
				</div>
			);
		};
	}
});
