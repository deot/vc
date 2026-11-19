/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import { Icon } from '../icon';
import type { Props } from './progress-props';

/**
 * Progress 与 MProgress 共用的渲染
 * - 颜色默认由样式按状态类取主题色；显式 color / trackColor 以内联局部变量覆盖（置灰时忽略 color）
 * - 进度以内联变量 --vc-progress-percent（0–100）传给样式，挂载时由样式的 `@starting-style` 从 0 过渡
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MProgress）：根节点加标记类 vcm-progress，数字 strokeWidth（线形）、size 为 750 稿长度
 * @returns render
 */
export const useProgress = (props: Props, { slots }: SetupContext, options: { mobile?: boolean } = {}) => {
	const { mobile } = options;
	const name = mobile ? 'vc-progress vcm-progress' : 'vc-progress';
	const toLength = mobile ? toRem : toPx;

	const getPercent = () => {
		const v = Number(props.percent);
		// NaN 不满足任何比较，记为 0
		return v >= 100 ? 100 : v > 0 ? v : 0;
	};

	const getColor = (status: string) => {
		const { color } = props;
		if (props.disabled || !color) return;
		return typeof color === 'string' ? color : color[status];
	};

	const renderText = (percent: number, status: string) => {
		if (slots.default) return slots.default({ percent, status });
		if (!props.showText) return;
		return <span class={props.textClass} style={props.textStyle}>{`${percent}%`}</span>;
	};

	const renderLine = (percent: number, status: string) => {
		const strokeWidth = props.strokeWidth ?? (props.textInside ? (mobile ? 36 : 16) : (mobile ? 8 : 6));
		const hasIcon = !props.textInside && !slots.default && props.showText && status !== 'default';
		const text = hasIcon
			? <Icon type={status} class="vc-progress-line__icon" />
			: renderText(percent, status);
		return (
			<div class={['vc-progress-line', { 'is-inside': props.textInside }]}>
				<div class="vc-progress-line__wrapper">
					<div class="vc-progress-line__box" style={{ height: toLength(strokeWidth) }}>
						<div class={['vc-progress-line__inner', { 'is-active': props.animated && !props.disabled }]}>
							{ props.textInside && text }
						</div>
					</div>
				</div>
				{ !props.textInside && text && <div class="vc-progress-line__percent">{ text }</div> }
			</div>
		);
	};

	const renderCircle = (percent: number, status: string) => {
		const strokeWidth = props.strokeWidth ?? 6;
		const radius = 50 - strokeWidth / 2;
		const length = Math.PI * 2 * radius;
		const d = `M 50,50 m 0,-${radius} a ${radius},${radius} 0 1 1 0,${2 * radius} a ${radius},${radius} 0 1 1 0,-${2 * radius}`;
		const size = typeof props.size === 'number' ? toLength(props.size) : props.size;
		const fontSize = typeof props.size === 'number' ? toLength(props.size * 0.2) : `calc(${props.size} * 0.2)`;
		return (
			<div class="vc-progress-circle">
				<div class="vc-progress-circle__box" style={{ width: size, height: size }}>
					<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
						<path class="vc-progress-circle__track" d={d} stroke-width={strokeWidth} fill-opacity="0" />
						{
							// 0% 时不画：round 端点在零长度上仍会画出一个圆点
							percent > 0 && (
								<path
									class="vc-progress-circle__path"
									d={d}
									style={{ 'stroke-dasharray': `${length}px ${length}px`, '--vc-progress-length': `${length}px` }}
									stroke-width={strokeWidth}
									stroke-linecap="round"
									fill-opacity="0"
								/>
							)
						}
					</svg>
					<div class="vc-progress-circle__inner">
						{
							slots.default
								? slots.default({ percent, status })
								// 默认文字字号为尺寸的 20%；套一层，textClass / textStyle 仍可覆盖
								: props.showText && <span class="vc-progress-circle__text" style={{ fontSize }}>{ renderText(percent, status) }</span>
						}
					</div>
				</div>
			</div>
		);
	};

	return () => {
		const percent = getPercent();
		const status = percent === 100 ? 'success' : props.status;
		const color = getColor(status);
		return (
			<div
				class={[name, `is-${status}`, { 'is-disabled': props.disabled }]}
				style={{
					'--vc-progress-percent': percent,
					'--vc-progress-bar-color': color,
					'--vc-progress-track-color': props.trackColor
				}}
				role="progressbar"
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-disabled={props.disabled || undefined}
			>
				{ props.type === 'circle' ? renderCircle(percent, status) : renderLine(percent, status) }
			</div>
		);
	};
};
