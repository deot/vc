/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import type { Props } from './spin-props';

/**
 * Spin 与 MSpin 共用的渲染：loading 插槽的内容按 size 设置字号；默认图标按 size 设置尺寸，字符框跟随外层字体
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MSpin）：根节点加标记类 vcm-spin，数字 size 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useSpin = (props: Props, context: SetupContext, options: { mobile?: boolean } = {}) => {
	const { slots } = context;
	const name = options.mobile ? 'vc-spin vcm-spin' : 'vc-spin';
	const toLength = options.mobile ? toRem : toPx;
	return () => {
		const size = toLength(props.size);
		return (
			<div class={name}>
				<span style={slots.loading ? { fontSize: size } : undefined}>
					{
						slots.loading?.() || (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								version="1.1"
								viewBox="0 0 32 32"
								style={{ width: size, height: size }}
							>
								<path
									stroke={props.foreground}
									d="M 16 2 A 14 14 0 1 0 30 15"
									fill="none"
									stroke-width="2"
									stroke-linecap="round"
								/>
								<path
									stroke={props.background}
									d="M 16 2 A 14 14 0 0 1 30 15"
									fill="none"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						)
					}
				</span>
				{ slots?.default?.() }
			</div>
		);
	};
};
