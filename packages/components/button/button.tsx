/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, computed, inject } from 'vue';
import { Icon } from '../icon';
import { Spin } from '../spin';
import { Debounce } from '../debounce';
import { props as buttonProps } from './button-props';

const COMPONENT_NAME = 'vc-button';

export const Button = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: buttonProps,
	setup(props, { slots }) {
		const vm = getCurrentInstance()!;
		const isHover = ref(false);
		const isLoading = ref(false);

		const group = inject('vc-button-group', {
			size: 'medium',
			vertical: false,
			circle: false
		});

		const classes = computed(() => ({
			'is-circle': props.circle || group.circle,
			'is-alone': !slots?.default,
			'is-round': props.round,
			'is-long': props.long,
			'is-disabled': props.disabled,
			'is-solid': props.solid,
			'is-dashed': props.dashed,
			'is-hover': isHover.value,
			[`is-${props.size}`]: true,
			[`is-${props.type}`]: true
		}));

		const handleClick = (...args: any[]) => {
			const fn = vm.vnode.props?.['onClick']?.(...args);

			if (fn && fn.then) {
				isLoading.value = true;

				fn
					.finally(() => {
						isLoading.value = false;
					});
			}
		};

		return () => {
			return (
				<Debounce
					tag={props.tag}
					class={{ 'vc-button': true, ...classes.value }}
					wait={props.wait}
					// @ts-ignore
					disabled={props.disabled}
					type={props.htmlType}
					onClick={handleClick}
					onMouseenter={() => isHover.value = true}
					onMouseleave={() => isHover.value = false}
				>
					{
						props.icon
						&& (<Icon type={props.icon} />)
					}
					{
						slots.icon && (slots?.icon?.({
							hover: isHover.value
						}))
					}
					{
						isLoading.value && (
							<Spin
								size={12}
								foreground={props.type === 'default' ? '#ccc' : '#fff'}
								class="vc-button__loading"
							/>
						)
					}

					{
						slots?.default && (
							<span>
								{ slots?.default?.() }
							</span>
						)
					}
				</Debounce>
			);
		};
	}
});
