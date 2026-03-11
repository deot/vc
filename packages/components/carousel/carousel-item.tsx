/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as carouselItemProps } from './carousel-item-props';
import { useCarouselItem } from './use-carousel-item';

const COMPONENT_NAME = 'vc-carousel-item';

export const CarouselItem = defineComponent({
	name: COMPONENT_NAME,
	props: carouselItemProps,
	setup(_, { slots, expose }) {
		const it = useCarouselItem(expose);
		return () => {
			return (
				<div
					// @ts-ignore
					vShow={it.isReady.value}
					class={[
						'vc-carousel-item',
						{
							'is-active': it.isActive.value,
							'is-card': it.isCard.value,
							'is-in-stage': it.isInStage.value,
							'is-hover': it.isHover.value,
							'is-animating': it.isAnimating.value && !it.isMove.value
						}
					]}
					style={it.itemStyle.value}
					onClick={it.handleItemClick}
				>
					{
						it.isCard.value && (
							<div
								// @ts-ignore
								vShow={!it.isActive.value}
								class="vc-carousel-item__mask"
							/>
						)
					}
					{slots.default?.()}
				</div>
			);
		};
	}
});
