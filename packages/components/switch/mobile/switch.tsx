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
	setup(props, context) {
		const { checked, classes, currentValue, isLoading, handleToggle, handleKeydown, renderText } = useSwitch(props, context);
		return () => {
			return (
				<span
					role="switch"
					aria-checked={checked.value}
					aria-disabled={props.disabled}
					tabindex={props.disabled ? -1 : 0}
					class={[classes.value, 'vcm-switch']}
					onClick={handleToggle}
					onKeydown={handleKeydown}
				>
					<input name={props.name} value={currentValue.value} type="hidden" />
					<span class="vcm-switch__content">
						{renderText(COMPONENT_NAME)}
					</span>
					<span class="vcm-switch__inner">
						{
							isLoading.value && (
								<MSpin
									size={32}
									class="vcm-switch__loading"
								/>
							)
						}
					</span>
				</span>
			);
		};
	}
});
