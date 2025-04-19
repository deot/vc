/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, computed, inject, onMounted } from 'vue';
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
		const hasSlot = ref(true);
		const isLoading = ref(false);

		const group = inject('vc-button-group', {
			size: 'medium',
			vertical: false,
			circle: false
		});

		const classes = computed(() => ({
			'is-circle': props.circle || group.circle,
			'is-alone': !hasSlot.value,
			'is-round': props.round,
			'is-long': props.long,
			'is-disabled': props.disabled,
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

		onMounted(() => {
			hasSlot.value = slots.default !== undefined;
		});

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
				>
					{
						props.icon
						&& (<Icon type={props.icon} />)
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
						hasSlot.value && (
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
