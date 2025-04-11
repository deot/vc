/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as cardProps } from './card-props';
import { Icon } from '../icon';

const COMPONENT_NAME = 'vc-card';

export const Card = defineComponent({
	name: COMPONENT_NAME,
	props: cardProps,
	setup(props, { slots }) {
		return () => {
			return (
				<div class={[{ 'is-border': props.border, 'is-shadow': props.shadow }, 'vc-card']}>
					{
						(props.title || slots.title) && (
							<div class="vc-card__header">
								{
									slots.title
										? slots.title?.()
										: (props.title && (
												<p>
													{ props.icon && (<Icon type={props.icon} />) }
													<span>{props.title}</span>
												</p>
											))
								}
							</div>
						)
					}
					{
						slots.extra && (
							<div class="vc-card__extra">
								{ slots.extra?.() }
							</div>
						)
					}
					<div style={`padding: ${props.padding}px`} class="vc-card__body">
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
