/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import { Customer } from '../customer';
import { Icon } from '../icon';
import type { Props } from './card-props';

/**
 * Card 与 MCard 共用的渲染
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MCard）：根节点加标记类 vcm-card，尺寸由 mobile/style.scss 覆盖局部变量；数字 padding 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useCard = (
	props: Props,
	{ slots }: SetupContext,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-card vcm-card' : 'vc-card';
	const toLength = options.mobile ? toRem : toPx;
	return () => {
		const extra = slots.extra && (
			<div class="vc-card__extra">
				{ slots.extra() }
			</div>
		);
		const hasHeader = !!(props.title || slots.title);
		return (
			<div class={[{ 'is-border': props.border, 'is-shadow': props.shadow }, name]}>
				{
					hasHeader && (
						<div class="vc-card__header">
							<div class="vc-card__title">
								{
									slots.title
										? slots.title()
										: (
												<p>
													{ props.icon && (<Icon type={props.icon} class="vc-card__icon" />) }
													<Customer tag="span" render={props.title} />
												</p>
											)
								}
							</div>
							{ extra }
						</div>
					)
				}
				{ !hasHeader && extra }
				<div style={{ padding: toLength(props.padding) }} class="vc-card__body">
					{ slots.default?.() }
				</div>
			</div>
		);
	};
};
