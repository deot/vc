/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { props as alertProps } from './alert-props';
import { Icon } from '../icon';
import { TransitionFade } from '../transition';

const COMPONENT_NAME = 'vc-alert';

export const Alert = defineComponent({
	name: COMPONENT_NAME,
	props: alertProps,
	setup(props, { slots, emit }) {
		const isActive = ref(false);

		const showIcon = computed(() => props.icon !== false);
		const iconType = computed(() => {
			return typeof props.icon === 'string' && props.icon ? props.icon : props.type;
		});

		const handleClose = () => {
			isActive.value = false;

			emit('close');
			emit('update:modelValue', false);
			emit('visible-change', false);
		};

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);
		return () => {
			return (
				<TransitionFade>
					{
						isActive.value && (
							<div
								class={[`is-${props.type}`, { 'has-icon': showIcon.value, 'has-desc': props.desc || slots.desc }, 'vc-alert']}
							>
								{
									showIcon.value && (
										<Icon
											type={iconType.value}
											class="vc-alert__icon"
										/>
									)
								}
								<div class="vc-alert__content">
									<div class="vc-alert__message">
										{
											props.title
												? (
														<div
															class="vc-alert__title"
															innerHTML={props.title}
														/>
													)
												: (
														<div class="vc-alert__title">
															{ slots?.default?.() }
														</div>
													)
										}
										{
											props.desc
												? (<div class="vc-alert__desc" innerHTML={props.desc} />)
												: (slots.desc && (<div class="vc-alert__desc">{ slots.desc?.() }</div>))
										}
									</div>
									{
										props.closable && (
											<div class="vc-alert__close" onClick={handleClose}>
												{ slots.close ? slots.close() : (<Icon type="close" />) }
											</div>
										)
									}
								</div>
							</div>
						)
					}
				</TransitionFade>
			);
		};
	}
});
