/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as carouselItemProps } from '../carousel-item-props';
import { useCarouselItem } from '../use-carousel-item';

const COMPONENT_NAME = 'vcm-carousel-item';

export const MCarouselItem = defineComponent({
	name: COMPONENT_NAME,
	props: carouselItemProps,
	setup(_, { slots, expose }) {
		const it = useCarouselItem(expose);
		return () => {
			return (
				<div
					// @ts-ignore
					vShow={it.isReady.value}
					style={it.itemStyle.value}
					class={{
						'vcm-carousel-item': true,
						'is-active': it.isActive.value,
						'is-card': it.isCard.value,
						'is-animating': it.isAnimating.value && !it.isMove.value,
						'is-in-stage': it.isInStage.value,
					}}
					onClick={it.handleItemClick}
				>
					{
						it.isCard.value && !it.isActive.value && (
							<div class="vcm-carousel-item__mask" />
						)
					}
					{slots.default?.()}
				</div>
			);
		};
	}
});
