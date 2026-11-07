/** @jsxImportSource vue */

import { ref, computed, watch } from 'vue';
import type { SetupContext } from 'vue';
import { Icon } from '../icon';
import type { Props } from './tag-props';

/**
 * Tag 与 MTag 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MTag）：根节点加标记类 vcm-tag，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useTag = (
	props: Props,
	{ emit, slots }: SetupContext<['close', 'change']>,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-tag vcm-tag' : 'vc-tag';
	const isChecked = ref(true);
	const classes = computed(() => {
		return {
			[`is-${props.color}`]: true,
			[`is-${props.type}`]: true,
			[`is-unchecked`]: !isChecked.value
		};
	});

	const handleClose = (e) => {
		e.stopPropagation();
		emit('close', e, props.value || undefined);
	};

	const handleCheck = (e: any) => {
		if (!props.checkable) return;
		e.stopPropagation();

		isChecked.value = !isChecked.value;

		emit('change', isChecked.value, props.value || undefined);
	};

	watch(
		() => props.checked,
		(v) => {
			isChecked.value = !!v;
		},
		{ immediate: true }
	);

	return () => {
		return (
			<div
				class={[classes.value, name]}
				// @ts-ignore
				onClick={handleCheck}
			>
				<div class="vc-tag__wrapper">
					{
						props.type === 'dot' && (
							<div>
								<span class="vc-tag__dot" />
							</div>
						)
					}
					<span>
						{ slots.default?.() }
					</span>
					{
						props.closable && (
							<Icon
								type="close"
								class="vc-tag__close"
								// @ts-ignore
								onClick={handleClose}
							/>
						)
					}
				</div>
			</div>
		);
	};
};
