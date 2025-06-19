/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
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
		const { checked, classes, currentValue, isLoading, handleToggle } = useSwitch(expose);

		const size = computed(() => {
			return props.height - props.borderWidth * 4;
		});

		const lefts = computed(() => {
			return {
				inner: checked.value ? props.width - props.borderWidth * 3 - size.value : props.borderWidth,
				loading: checked.value ? props.height - props.borderWidth * 2 : props.borderWidth * 2
			};
		});

		const contentOffset = computed(() => {
			return Math.max(props.height / 2, size.value) + props.borderWidth * 2;
		});
		return () => {
			return (
				<div
					style={{ width: `${props.width}px` }}
					class={[classes.value, 'vc-switch']}
				>
					<span
						style={{ height: `${props.height}px`, borderWidth: `${props.borderWidth}px` }}
						class="vc-switch__wrapper"
						onClick={handleToggle}
					>
						<input name={props.name} value={currentValue.value} type="hidden" />
						<span
							class="vc-switch__content"
							style={{
								left: `${checked.value ? props.height / 4 : contentOffset.value}px`,
								right: `${checked.value ? contentOffset.value : props.height / 4}px`,
								top: 0,
								bottom: 0
							}}
						>
							{ currentValue.value === props.checkedValue ? (slots.checked ? slots.checked() : props.checkedText) : null}
							{ currentValue.value === props.uncheckedValue ? (slots.unchecked ? slots.unchecked() : props.uncheckedText) : null}
						</span>
						<span
							class="vc-switch__inner"
							style={{
								width: `${size.value}px`,
								height: `${size.value}px`,
								left: `${lefts.value.inner}px`,
								top: `${props.borderWidth}px`
							}}
						/>
						{
							isLoading.value && (
								<Spin
									size={14}
									foreground="#fff"
									class="vc-switch__loading"
									style={{
										left: `${lefts.value.loading}px`
									}}
								/>
							)
						}
					</span>
				</div>
			);
		};
	}
});
