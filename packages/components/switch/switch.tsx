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
	setup(props, context) {
		const { checked, classes, currentValue, isLoading, handleToggle, handleKeydown, renderText } = useSwitch(props, context);

		const size = computed(() => {
			return props.height - props.borderWidth * 4;
		});

		// 加载标记占滑块的 3 / 4，四周留白
		const spinSize = computed(() => {
			return Math.round(size.value * 3 / 4);
		});

		// 滑块与轨道之间留出 borderWidth；选中时贴到右侧，轨道宽度可能随文字变化，用百分比定位
		const thumbLeft = computed(() => {
			return checked.value ? `calc(100% - ${size.value + props.borderWidth}px)` : `${props.borderWidth}px`;
		});

		// 文字在流内撑开轨道：滑块一侧让出滑块，两侧各留 height / 4；width 只作为最小宽度
		const contentPadding = computed(() => {
			const gap = props.height / 4;
			const thumb = props.borderWidth + size.value + gap;
			return checked.value ? `0 ${thumb}px 0 ${gap}px` : `0 ${gap}px 0 ${thumb}px`;
		});
		return () => {
			return (
				<div
					class={[classes.value, 'vc-switch']}
				>
					<span
						role="switch"
						aria-checked={checked.value}
						aria-disabled={props.disabled}
						tabindex={props.disabled ? -1 : 0}
						style={{ minWidth: `${props.width}px`, height: `${props.height}px`, borderWidth: `${props.borderWidth}px` }}
						class="vc-switch__wrapper"
						onClick={handleToggle}
						onKeydown={handleKeydown}
					>
						<input name={props.name} value={currentValue.value} type="hidden" />
						<span
							class="vc-switch__content"
							style={{ padding: contentPadding.value }}
						>
							{renderText(COMPONENT_NAME)}
						</span>
						<span
							class="vc-switch__inner"
							style={{
								width: `${size.value}px`,
								height: `${size.value}px`,
								left: thumbLeft.value,
								top: `${props.borderWidth}px`
							}}
						>
							{
								isLoading.value && (
									<Spin
										size={spinSize.value}
										class="vc-switch__loading"
									/>
								)
							}
						</span>
					</span>
				</div>
			);
		};
	}
});
