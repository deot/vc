/** @jsxImportSource vue */

import { defineComponent, ref, withModifiers } from 'vue';
import { useCarousel } from '../use-carousel';
import { props as carouselProps } from '../carousel-props';

const COMPONENT_NAME = 'vcm-carousel';

export const MCarousel = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...carouselProps,
		dots: {
			type: [String, Boolean],
			default: false,
		},
		indicator: {
			type: Boolean,
			default: true,
		}
	},
	setup(props, { slots, expose }) {
		const wrapper = ref<HTMLElement | null>(null);
		const content = ref<HTMLElement | null>(null);
		const carousel = useCarousel(wrapper, content, expose);

		let scrollStatus = 0;

		const handleTouchStart = (e: any) => {
			carousel.handleStart(e.touches[0]);
			scrollStatus = 0;
		};

		const handleTouchMove = (e: any) => {
			const absX = Math.abs(e.touches[0].screenX - carousel.startX.value);
			const absY = Math.abs(e.touches[0].screenY - carousel.startY.value);

			if (!props.vertical && absX > absY && scrollStatus !== 1) {
				e.preventDefault();
				carousel.handleMove(e.touches[0]);
				scrollStatus = 2;
				return;
			}
			if (props.vertical && absY > absX) {
				e.preventDefault();
				carousel.handleMove(e.touches[0]);
				return;
			}
			if (scrollStatus === 0) {
				scrollStatus = 1;
			}
		};

		// e.changedTouches[0]
		const handleTouchEnd = () => {
			carousel.handleEnd();
			scrollStatus = 0;
		};

		return () => {
			return (
				<div
					ref={wrapper}
					class={['vcm-carousel', `is-${carousel.direction.value}`]}
					onTouchstart={withModifiers(handleTouchStart, ['stop'])}
					onTouchmove={withModifiers(handleTouchMove, ['stop'])}
					onTouchend={withModifiers(handleTouchEnd, ['stop'])}
				>
					<div
						ref={content}
						style={{
							height: props.height ? `${props.height}px` : 'auto',
						}}
						class="vcm-carousel__wrapper"
					>
						{slots.default?.()}
					</div>
					{
						props.dots && (
							<ul class={['vcm-carousel__dots', ...carousel.dotsClasses.value]}>
								{carousel.items.value.map((_, index) => (
									<li
										key={index}
										class={[
											'vcm-carousel__dot',
											'is-' + carousel.direction.value,
											{ 'is-active': index === carousel.activeIndex.value }
										]}
										onClick={(e: Event) => {
											e.stopPropagation();
											carousel.handleDotClick(index);
										}}
									>
										<button class="vcm-carousel__button">
											{carousel.hasLabel.value && (
												<span>{(carousel.items.value[index].props as any).label}</span>
											)}
										</button>
									</li>
								))}
							</ul>
						)
					}
					{
						!props.card && props.indicator && (
							<div class="vcm-carousel__indicator">
								<span>{carousel.activeIndex.value + 1}</span>
								<span> / </span>
								<span>{carousel.items.value.length}</span>
							</div>
						)
					}
				</div>
			);
		};
	}
});
