/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { inject } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import type { Props } from './skeleton-item-props';

/**
 * SkeletonItem 与 MSkeletonItem 共用的渲染：一个占位块，闪光由 ::after 画出
 * - animated 不传时：在 Skeleton 内跟随外层（CSS 变量继承），单独使用时开启
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MSkeletonItem）：加标记类 vcm-skeleton-item，数字宽高为 750 稿长度
 * @returns render
 */
export const useSkeletonItem = (props: Props, context: SetupContext, options: { mobile?: boolean } = {}) => {
	const name = options.mobile ? 'vc-skeleton-item vcm-skeleton-item' : 'vc-skeleton-item';
	const toLength = options.mobile ? toRem : toPx;
	const inherit = inject('vc-skeleton', false);

	return () => {
		const animated = props.animated ?? (inherit ? undefined : true);
		return (
			<div
				class={[
					name,
					`is-${props.shape}`,
					animated === true && 'is-animated',
					animated === false && 'is-static'
				]}
				style={{
					width: props.width != null ? toLength(props.width) : undefined,
					height: props.height != null ? toLength(props.height) : undefined
				}}
				aria-hidden="true"
			/>
		);
	};
};
