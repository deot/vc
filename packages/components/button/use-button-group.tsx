/** @jsxImportSource vue */

import { computed, provide } from 'vue';
import type { SetupContext } from 'vue';
import type { Props } from './button-group-props';

/**
 * ButtonGroup 与 MButtonGroup 共用的渲染；两端组内按钮都从 vc-button-group 读取 size、circle、vertical
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MButtonGroup）：根节点加标记类 vcm-button-group，圆角与 MButton 的尺寸一致
 * @returns render
 */
export const useButtonGroup = (props: Props, { slots }: SetupContext, options: { mobile?: boolean } = {}) => {
	provide('vc-button-group', props);

	const classes = computed(() => ({
		'vc-button-group': true,
		'vcm-button-group': !!options.mobile,
		'is-vertical': props.vertical,
		'is-circle': props.circle,
		[`is-${props.size}`]: !!props.size
	}));

	return () => {
		return props.styleless
			? slots.default?.()
			: (
					<div class={classes.value}>
						{slots.default?.()}
					</div>
				);
	};
};
