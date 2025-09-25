/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { props as alertProps } from './alert-props';
import { Icon } from '../icon';
import { TransitionFade } from '../transition';

const COMPONENT_NAME = 'vc-alert';

// [color, borderColor, backgroundColor], -> CSS
const THEME_MAP = {
	info: ['#456CF6', '#91d5ff', '#e6f7ff'],
	success: ['#52c41a', '#b7eb8f', '#f6ffed'],
	error: ['#ed4014', '#ffb08f', '#fbe9e9'],
	warning: ['#ffbf00', '#ffe58f', '#fffbe6']
};

export const Alert = defineComponent({
	name: COMPONENT_NAME,
	props: alertProps,
	setup(props, { slots, emit }) {
		const isActive = ref(false);

		const showIcon = computed(() => props.icon !== false);
		const containerStyle = computed(() => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [_, borderColor, backgroundColor] = THEME_MAP[props.type];
			return {
				borderColor,
				backgroundColor
			};
		});

		const iconStyle = computed(() => {
			const [color] = THEME_MAP[props.type];
			return {
				color
			};
		});

		const titleStyle = computed(() => {
			const [color] = THEME_MAP[props.type];
			return (props.desc || slots.desc)
				? {
						marginBottom: '5px',
						fontSize: '14px',
						color
					}
				: {};
		});

		const descStyle = computed(() => {
			const [color] = THEME_MAP[props.type];
			return {
				color,
				opacity: '.7'
			};
		});

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
								style={containerStyle.value}
							>
								{
									showIcon.value && (
										<Icon
											type={iconType.value}
											style={iconStyle.value}
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
															style={titleStyle.value}
															innerHTML={props.title}
														/>
													)
												: (
														<div style={titleStyle.value}>
															{ slots?.default?.() }
														</div>
													)
										}
										{
											props.desc
												? (<div style={descStyle.value} innerHTML={props.desc} />)
												: (slots.desc && (<div style={descStyle.value}>{ slots.desc?.() }</div>))
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
