/** @jsxImportSource vue */

import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import { useLocale } from '../locale';
import { TransitionFade } from '../transition';
import type { Props } from './spin-props';

/**
 * Spin 与 MSpin 共用
 * - 只有图标（及提示）时，根节点为 span，像文字一样排版
 * - 有默认插槽时包裹内容：加载中在内容上居中显示图标，mask 为 true 时另盖一层蒙层
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MSpin）：根节点加标记类 vcm-spin，数字 size 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useSpin = (props: Props, context: SetupContext, options: { mobile?: boolean } = {}) => {
	const { slots } = context;
	const { t } = useLocale();
	const name = options.mobile ? 'vc-spin vcm-spin' : 'vc-spin';
	const toLength = options.mobile ? toRem : toPx;

	// 有延迟时，挂载或开始加载后过了 delay 才显示
	const isVisible = ref(props.loading && !props.delay);
	let timer: ReturnType<typeof setTimeout> | undefined;
	const sync = () => {
		clearTimeout(timer);
		if (!props.loading || !props.delay) {
			isVisible.value = props.loading;
			return;
		}
		timer = setTimeout(() => (isVisible.value = true), props.delay);
	};

	watch(() => props.loading, sync);
	onMounted(() => !isVisible.value && sync());
	onBeforeUnmount(() => clearTimeout(timer));

	const renderSpinner = () => {
		const size = toLength(props.size);
		const hasTip = !!(slots.tip || props.tip);
		const style: Record<string, string> = {};
		props.color && (style['--vc-spin-color'] = props.color);
		props.trackColor && (style['--vc-spin-track-color'] = props.trackColor);
		return (
			<span
				class={[name, { 'has-tip': hasTip }]}
				style={style}
				role="status"
				aria-label={hasTip ? undefined : t('vc.Spin.loading')}
			>
				<span class="vc-spin__indicator" style={slots.loading ? { fontSize: size } : undefined}>
					{
						slots.loading?.() || (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 32 32"
								aria-hidden="true"
								style={{ width: size, height: size }}
							>
								<circle class="vc-spin__track" cx="16" cy="16" r="14" />
								<path class="vc-spin__arc" d="M 16 2 A 14 14 0 0 1 30 16" />
							</svg>
						)
					}
				</span>
				{ hasTip && (<span class="vc-spin__tip">{ slots.tip?.() || props.tip }</span>) }
			</span>
		);
	};

	const renderLayer = () => {
		return (
			<TransitionFade duration={200}>
				{
					isVisible.value && (
						<div class={['vc-spin-wrapper__layer', { 'is-mask': props.mask }]}>
							{ renderSpinner() }
						</div>
					)
				}
			</TransitionFade>
		);
	};

	return () => {
		if (!slots.default) {
			return isVisible.value ? renderSpinner() : null;
		}
		return (
			<div
				class={['vc-spin-wrapper', { 'is-masked': isVisible.value && props.mask }]}
				aria-busy={isVisible.value ? 'true' : undefined}
			>
				<div class="vc-spin-wrapper__content">
					{ slots.default() }
				</div>
				{ renderLayer() }
			</div>
		);
	};
};
