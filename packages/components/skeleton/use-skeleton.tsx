/** @jsxImportSource vue */

import type { SetupContext, VNode } from 'vue';
import { provide, ref, watch, onBeforeUnmount } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import type { Props, SkeletonImage } from './skeleton-props';

/**
 * Skeleton 与 MSkeleton 共用：预设骨架（图片 + 标题 + 段落）或 placeholder 插槽，按 repeat 重复；loading 为 false 时渲染默认插槽
 * - 预设块直接渲染为 div（不经过 SkeletonItem 组件），类名与 SkeletonItem 相同
 * - delay：loading 持续超过 delay 毫秒才显示骨架；等待期间保留已有内容，首次加载时为空
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端（MSkeleton）：根节点加标记类 vcm-skeleton，数字长度为 750 稿，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns render
 */
export const useSkeleton = (props: Props, { slots }: SetupContext, options: { mobile?: boolean } = {}) => {
	const name = options.mobile ? 'vc-skeleton vcm-skeleton' : 'vc-skeleton';
	// 预设块不带 vcm-skeleton-item：尺寸取自根节点的局部变量
	const item = 'vc-skeleton-item';
	const toLength = options.mobile ? toRem : toPx;

	// SkeletonItem 据此判断是否在 Skeleton 内（animated 不传时跟随外层）
	provide('vc-skeleton', true);

	const visible = ref(props.loading && !props.delay);
	// 默认插槽是否渲染过：之后的 loading 在 delay 期间保留内容
	let loaded = !props.loading;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const schedule = (loading: boolean) => {
		clearTimeout(timer);
		if (!loading) {
			loaded = true;
			visible.value = false;
		} else if (!props.delay) {
			visible.value = true;
		} else {
			timer = setTimeout(() => (visible.value = true), props.delay);
		}
	};

	props.loading && props.delay && schedule(true);
	watch(() => props.loading, schedule);
	onBeforeUnmount(() => clearTimeout(timer));

	const renderImage = () => {
		if (!props.image) return null;
		const { size, shape = 'square' } = (props.image === true ? {} : props.image) as SkeletonImage;
		const length = size != null ? toLength(size) : undefined;
		return (
			<div
				class={[item, `is-${shape}`, 'vc-skeleton__image']}
				style={length && { width: length, height: length }}
			/>
		);
	};

	const renderTitle = () => {
		const { title } = props;
		if (title === false) return null;
		return (
			<div
				class={[item, 'is-square', 'vc-skeleton__title']}
				style={title !== true ? { width: toLength(title) } : undefined}
			/>
		);
	};

	const renderRows = () => {
		const { rows } = props;
		const widths = typeof rows === 'number' ? Array.from({ length: Math.max(rows, 0) }) : rows;
		if (!widths.length) return null;
		return (
			<div class="vc-skeleton__rows">
				{
					widths.map(width => (
						<div
							class={[item, 'is-square', 'vc-skeleton__row']}
							style={width != null ? { width: toLength(width as number | string) } : undefined}
						/>
					))
				}
			</div>
		);
	};

	const renderGroup = (index: number) => {
		if (slots.placeholder) {
			return (<div class="vc-skeleton__group is-custom" aria-hidden="true">{ slots.placeholder({ index }) }</div>);
		}
		const title = renderTitle();
		const rows = renderRows();
		return (
			<div class="vc-skeleton__group" aria-hidden="true">
				{ renderImage() }
				{ (title || rows) && (
					<div class="vc-skeleton__content">
						{ title }
						{ rows }
					</div>
				) }
			</div>
		);
	};

	return () => {
		if (!visible.value) {
			return !props.loading || loaded ? slots.default?.() : null;
		}
		const groups: VNode[] = [];
		for (let i = 0; i < Math.max(props.repeat, 1); i++) {
			groups.push(renderGroup(i));
		}
		return (
			<div
				class={[name, props.animated ? 'is-animated' : 'is-static']}
				aria-busy="true"
			>
				{ groups }
			</div>
		);
	};
};
