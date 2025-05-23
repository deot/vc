/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as switchProps } from './switch-props';
import { useSwitch } from './use-switch';
import { Spin } from '../spin';

const COMPONENT_NAME = 'vc-switch';

export const Switch = defineComponent({
	name: COMPONENT_NAME,
	props: switchProps,
	// click -> onClick要被拦截，此处不能放置
	emits: ['update:modelValue', 'change', 'click'],
	setup(props, { slots, expose }) {
		const { classes, currentValue, isLoading, handleToggle } = useSwitch(expose);
		return () => {
			return (
				<span
					class={[classes.value, 'vc-switch']}
					onClick={handleToggle}
				>
					<input name={props.name} value={currentValue.value} type="hidden" />
					<span class="vc-switch__content">
						{ currentValue.value === props.checkedValue ? (slots.checked ? slots.checked() : props.checkedText) : null}
						{ currentValue.value === props.uncheckedValue ? (slots.unchecked ? slots.unchecked() : props.uncheckedText) : null}
					</span>
					<span class="vc-switch__inner" />
					{
						isLoading.value && (
							<Spin
								size={14}
								foreground="#fff"
								class="vc-switch__loading"
							/>
						)
					}
				</span>
			);
		};
	}
});
