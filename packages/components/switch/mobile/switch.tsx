/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as switchProps } from '../switch-props';
import { useSwitch } from '../use-switch';
import { MSpin } from '../../spin/index.m';

const COMPONENT_NAME = 'vcm-switch';

export const MSwitch = defineComponent({
	name: COMPONENT_NAME,
	props: switchProps,
	// click -> onClick要被拦截，此处不能放置
	emits: ['update:modelValue', 'change', 'click'],
	setup(props, { slots, expose }) {
		const { classes, currentValue, isLoading, handleToggle } = useSwitch(expose);
		return () => {
			return (
				<span
					class={[classes.value, 'vcm-switch']}
					onClick={handleToggle}
				>
					<input name={props.name} value={currentValue.value} type="hidden" />
					<span class="vcm-switch__content">
						{ currentValue.value === props.checkedValue ? (slots.checked ? slots.checked() : props.checkedText) : null}
						{ currentValue.value === props.uncheckedValue ? (slots.unchecked ? slots.unchecked() : props.uncheckedText) : null}
					</span>
					<span class="vcm-switch__inner" />
					{
						isLoading.value && (
							<MSpin
								size={14}
								foreground="#fff"
								class="vcm-switch__loading"
							/>
						)
					}
				</span>
			);
		};
	}
});
