/** @jsxImportSource vue */

import { getCurrentInstance, ref, computed, inject } from 'vue';
import type { SetupContext } from 'vue';
import { toRem } from '@deot/vc-shared';
import { Debounce } from '../debounce';
import { Icon } from '../icon';
import { Spin } from '../spin';
import type { Props } from './button-props';

/**
 * Button 与 MButton 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MButton）：根节点加标记类 vcm-button，尺寸由 mobile/style.scss 覆盖局部变量；加载图标为 750 稿
 * @returns render
 */
export const useButton = (
	props: Props,
	{ slots }: SetupContext<['click']>,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-button vcm-button' : 'vc-button';
	const spinSize = options.mobile ? toRem(28) : 12;

	// onClick 返回的 Promise 决定加载状态：声明在 emits 中的监听不在 attrs 里，只能从 vnode 上读
	const vm = getCurrentInstance()!;
	const isHover = ref(false);
	const isLoading = ref(false);

	const group = inject('vc-button-group', {
		size: '',
		vertical: false,
		circle: false
	});

	const classes = computed(() => ({
		'is-circle': props.circle || group.circle,
		'is-alone': !slots?.default,
		'is-with-icon': Boolean(props.icon || slots.icon),
		'is-loading': isLoading.value,
		'is-round': props.round,
		'is-long': props.long,
		'is-disabled': props.disabled,
		'is-solid': props.solid,
		'is-dashed': props.dashed,
		'is-hover': isHover.value,
		[`is-${group.size || props.size}`]: true,
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
		// 只有图标的圆形按钮放不下加载图标与图标，加载中只显示加载图标
		const showIcon = !(isLoading.value && props.round && !slots.default);
		return (
			<Debounce
				tag={props.tag}
				class={{ [name]: true, ...classes.value }}
				wait={props.wait}
				// @ts-ignore
				disabled={props.disabled}
				type={props.htmlType}
				onClick={handleClick}
				onMouseenter={() => isHover.value = true}
				onMouseleave={() => isHover.value = false}
			>
				{
					isLoading.value && (
						<Spin
							size={spinSize}
							foreground={
								props.type === 'default'
									? 'var(--vc-button-color-light-deepest, var(--vc-color-light-deepest))'
									: 'currentColor'
							}
							background="var(--vc-button-color-primary, var(--vc-color-primary))"
							class="vc-button__loading"
						/>
					)
				}
				{
					showIcon
					&& props.icon
					&& (
						<span class="vc-button__icon">
							<Icon type={props.icon} />
						</span>
					)
				}
				{
					showIcon && slots.icon && (
						<span class="vc-button__icon">
							{
								slots.icon({
									hover: isHover.value
								})
							}
						</span>
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
};
