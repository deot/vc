/** @jsxImportSource vue */

import type { Slots } from 'vue';
import type { Props } from './spin-props';

/**
 * Spin 与 MSpin 共用的渲染：loading 插槽的内容按 size 设置字号；默认图标按 size 设置尺寸，字符框跟随外层字体
 * @param options ~
 * @param options.props ~
 * @param options.slots ~
 * @param options.size 已换算的 CSS 长度
 * @param options.className 根节点类名
 * @returns ~
 */
export const renderSpin = (options: { props: Props; slots: Slots; size: string; className: string }) => {
	const { props, slots, size, className } = options;
	return (
		<div class={className}>
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
