/** @jsxImportSource vue */

import { ref, shallowRef, computed, watch, onBeforeUnmount } from 'vue';
import type { SetupContext } from 'vue';
import { scrollIntoView } from '@deot/helper-dom';
import { toPx, toRem } from '@deot/vc-shared';
import { useRem } from '@deot/vc-hooks';
import { Icon } from '../icon';
import { useLocale } from '../locale';
import { useCarrierArea, getCarrierArea } from '../scroller/core/carrier-area';
import type { ExternalCarrier } from '../scroller/core/carrier';
import type { Props } from './back-top-props';

// 用户自己开始滚动时停止回到顶部的动画
const INTERRUPTS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;

const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * BackTop / MBackTop 共用的显示判断、定位与渲染
 * 	- 滚动容器从原处向上查找（vc Scroller / 滚动元素 / window），不开放属性；查找、portal、KeepAlive 见 useCarrierArea
 * 	- 按钮为 position: fixed，默认挂到 body；滚动容器是元素时，right / bottom 相对它的可视区（去掉边框与滚动条），
 * 	  容器在视口中的位置由 --vc-back-top-inset-right / --vc-back-top-inset-bottom 补上（直接写到按钮上），外层滚动、尺寸变化后要显示时重算
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @param context.attrs ~
 * @param options ~
 * @param options.mobile 移动端（MBackTop）：根节点加标记类 vcm-back-top，数字 visibilityHeight / right / bottom 为 750 稿长度，随 --vc-rem 缩放
 * @returns render
 */
export const useBackTop = (
	props: Props,
	context: SetupContext<['update:modelValue', 'click']>,
	options: { mobile?: boolean } = {}
) => {
	const { slots, emit, expose, attrs } = context;
	const name = options.mobile ? 'vc-back-top vcm-back-top' : 'vc-back-top';
	const toLength = options.mobile ? toRem : toPx;
	const rem = options.mobile ? useRem() : null;
	const { t } = useLocale();

	const button = shallowRef<HTMLButtonElement>();
	const visible = ref(false);

	// 滚动容器（元素）的可视区是否还露出；外层滚动、尺寸变化后标为过期，要显示时再量
	let isAreaVisible = true;
	let isAreaStale = true;

	const style = computed(() => ({
		'--vc-back-top-right': props.right == null ? undefined : toLength(props.right),
		'--vc-back-top-bottom': props.bottom == null ? undefined : toLength(props.bottom),
		'zIndex': props.zIndex
	}));

	const getThreshold = () => {
		const value = props.visibilityHeight ?? (options.mobile ? 400 : 200);
		return rem ? value * rem.value : value;
	};

	// 容器可视区右边、下边到视口右边、下边的距离（px）直接写到按钮上，外层滚动时不触发重新渲染
	const writeInset = (key: 'right' | 'bottom', value: number) => {
		button.value?.style.setProperty(`--vc-back-top-inset-${key}`, value > 0 ? `${value}px` : '');
	};

	const measure = (carrier: ExternalCarrier) => {
		isAreaStale = false;
		const area = getCarrierArea(carrier);
		isAreaVisible = area.visible;
		writeInset('right', area.viewportWidth - area.right);
		writeInset('bottom', area.viewportHeight - area.bottom);
	};

	// 进度直接写到按钮上，滚动时不触发重新渲染
	const writeProgress = (carrier: ExternalCarrier) => {
		const max = carrier.scrollSize - carrier.clientSize;
		const value = max > 0 ? Math.min(Math.max(carrier.mainOffset / max, 0), 1) : 0;
		button.value?.style.setProperty('--vc-back-top-progress', value.toFixed(4));
	};

	// 容器自身滚动：可视区不变，只按滚动位置判断；滚动未超过阈值时不读布局
	const update = () => {
		const carrier = area.getCarrier();
		let next = !!carrier && area.isActive() && carrier.mainOffset >= getThreshold();
		if (next) {
			isAreaStale && measure(carrier!);
			next = isAreaVisible;
		}
		next && props.showProgress && writeProgress(carrier!);
		if (next === visible.value) return;
		visible.value = next;
		emit('update:modelValue', next);
	};

	// 外层（含页面）滚动、容器尺寸变化：容器在视口中的位置随之变化
	const layout = () => {
		isAreaStale = true;
		update();
	};

	// 进行中的回到顶部动画：再次点击、用户自己滚动、卸载、失活时停止
	let motion: AbortController | undefined;
	const stopMotion = () => {
		motion?.abort();
		motion = undefined;
	};

	// KeepAlive 失活时隐藏并停止监听，激活后重新判断
	const area = useCarrierArea({
		portal: () => props.portal,
		target: button,
		placeholderClass: 'vc-back-top__placeholder',
		listeners: { scroll: update, layout },
		onDeactivated: () => {
			stopMotion();
			update();
		}
	});

	const scrollToTop = () => {
		stopMotion();
		const carrier = area.getCarrier();
		if (!carrier) return;
		const from = carrier.mainOffset;
		const duration = prefersReducedMotion() ? 0 : props.duration;
		if (!from) return;
		if (!duration || duration <= 0) {
			carrier.setMainOffset(0);
			return;
		}
		// vc Scroller：交给实例，同步自绘滚动条；它自己处理滚轮等打断
		if (carrier.scroller) {
			carrier.scroller.scrollTo({ y: 0, duration });
			return;
		}
		const controller = new AbortController();
		motion = controller;
		INTERRUPTS.forEach(type => window.addEventListener(type, stopMotion, { passive: true, once: true, signal: controller.signal }));
		scrollIntoView(carrier.target, { from, to: 0, duration, signal: controller.signal }).then(() => {
			motion === controller && stopMotion();
		});
	};

	const handleClick = (e: MouseEvent) => {
		emit('click', e);
		scrollToTop();
	};

	watch(() => [props.visibilityHeight, props.showProgress], update);
	rem && watch(rem, update);

	onBeforeUnmount(stopMotion);

	// refresh：重新查找滚动容器并判断是否显示（如滚动容器由外部替换后）
	expose({ refresh: area.refresh, visible });

	const renderButton = () => (
		<button
			{...attrs}
			ref={button}
			type="button"
			class={[name, { 'is-visible': visible.value, 'is-progress': props.showProgress }]}
			style={style.value}
			aria-label={t('vc.BackTop.label')}
			aria-hidden={visible.value ? undefined : 'true'}
			tabindex={visible.value ? undefined : -1}
			onClick={handleClick}
		>
			{slots.default ? slots.default({ visible: visible.value }) : <Icon type="back-top" class="vc-back-top__icon" />}
		</button>
	);

	return () => area.render(renderButton());
};
