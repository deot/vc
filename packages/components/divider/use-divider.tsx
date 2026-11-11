/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import type { Props } from './divider-props';

/**
 * Divider 与 MDivider 共用的渲染：线由根节点的 ::before / ::after 画出，文字夹在中间
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MDivider）：根节点加标记类 vcm-divider，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useDivider = (props: Props, { slots }: SetupContext, options: { mobile?: boolean } = {}) => {
	const name = options.mobile ? 'vc-divider vcm-divider' : 'vc-divider';
	return () => {
		const hasText = !!slots.default && !props.vertical;
		return (
			<div
				class={[
					name,
					props.vertical ? 'is-vertical' : `is-horizontal is-${props.placement}`,
					{ 'is-with-text': hasText, 'is-dashed': props.dashed }
				]}
			>
				{ hasText && (<div class="vc-divider__text">{ slots.default!() }</div>) }
			</div>
		);
	};
};
