/** @jsxImportSource vue */

import { ref, shallowRef, reactive, computed, watch, onMounted, onBeforeUnmount, onActivated, onDeactivated, Teleport } from 'vue';
import type { SetupContext } from 'vue';
import { Resize } from '@deot/helper-resize';
import { scrollIntoView } from '@deot/helper-dom';
import { toPx, toRem } from '@deot/vc-shared';
import { useRem } from '@deot/vc-hooks';
import { Icon } from '../icon';
import { useLocale } from '../locale';
import { getScale } from '../scroller/utils';
import { ScrollerManager } from '../scroller/core/manager';
import { getAxisKeys, resolveExternalCarrier } from '../scroller/core/carrier';
import type { ExternalCarrier } from '../scroller/core/carrier';
import type { Props } from './back-top-props';

const AXIS_KEYS = getAxisKeys(true);
const SHARED = { shared: true };
// 用户自己开始滚动时停止回到顶部的动画
const INTERRUPTS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;

const prefersReducedMotion = () => {
	return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
};

/**
 * BackTop / MBackTop 共用的显示判断、定位与渲染
 * 	- 滚动容器从原处向上查找（vc Scroller / 滚动元素 / window，见 resolveExternalCarrier），不开放属性；挂载与 refresh 时查找
 * 	- 按钮为 position: fixed，默认挂到 body；滚动容器是元素时，right / bottom 相对它的可视区（去掉边框与滚动条），
 * 	  容器在视口中的位置由 --vc-back-top-inset-right / --vc-back-top-inset-bottom 补上，外层滚动、尺寸变化时重算
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

	const placeholder = shallowRef<HTMLElement>(); // portal 时留在原处的占位节点，从它向上查找滚动容器
	const button = shallowRef<HTMLButtonElement>();
	const visible = ref(false);
	// 滚动容器是元素时，其可视区右边、下边到视口右边、下边的距离（px）
	const inset = reactive({ right: 0, bottom: 0 });

	let carrier: ExternalCarrier | undefined;
	let offs: Array<() => void> = [];
	let isActive = true; // KeepAlive 失活时为 false

	const style = computed(() => ({
		'--vc-back-top-right': props.right == null ? undefined : toLength(props.right),
		'--vc-back-top-bottom': props.bottom == null ? undefined : toLength(props.bottom),
		'--vc-back-top-inset-right': inset.right ? `${inset.right}px` : undefined,
		'--vc-back-top-inset-bottom': inset.bottom ? `${inset.bottom}px` : undefined,
		'zIndex': props.zIndex
	}));

	const getThreshold = () => {
		const value = props.visibilityHeight ?? (options.mobile ? 400 : 200);
		return rem ? value * rem.value : value;
	};

	/**
	 * 量滚动容器（元素）的可视区：去掉边框与滚动条，并限制在视口内
	 * @param el 滚动容器
	 * @returns 可视区在视口中是否还露出
	 */
	const measureInset = (el: HTMLElement) => {
		const rect = el.getBoundingClientRect();
		const scaleX = getScale(el, 'x', rect);
		const scaleY = getScale(el, 'y', rect);
		const viewport = document.documentElement;
		const right = Math.min(rect.left + (el.clientLeft + el.clientWidth) * scaleX, viewport.clientWidth);
		const bottom = Math.min(rect.top + (el.clientTop + el.clientHeight) * scaleY, viewport.clientHeight);
		inset.right = Math.max(viewport.clientWidth - right, 0);
		inset.bottom = Math.max(viewport.clientHeight - bottom, 0);
		return right > Math.max(rect.left, 0) && bottom > Math.max(rect.top, 0);
	};

	// 进度直接写到按钮上，滚动时不触发重新渲染
	const writeProgress = () => {
		const max = carrier!.scrollSize - carrier!.clientSize;
		const value = max > 0 ? Math.min(Math.max(carrier!.mainOffset / max, 0), 1) : 0;
		button.value?.style.setProperty('--vc-back-top-progress', value.toFixed(4));
	};

	const update = () => {
		let next = !!carrier && isActive && carrier.mainOffset >= getThreshold();
		// 只在要显示时量容器，滚动未超过阈值时不读布局
		if (next && !carrier!.isWindow) {
			next = measureInset(carrier!.target as HTMLElement);
		}
		next && props.showProgress && writeProgress();
		if (next === visible.value) return;
		visible.value = next;
		emit('update:modelValue', next);
	};

	const unbind = () => {
		offs.forEach(fn => fn());
		offs = [];
		carrier = undefined;
	};

	const bind = () => {
		unbind();
		const anchor = props.portal ? placeholder.value : button.value;
		if (!anchor) return;
		carrier = resolveExternalCarrier(anchor, AXIS_KEYS);
		offs.push(carrier.on(update));
		if (!carrier.isWindow) {
			const el = carrier.target as HTMLElement;
			// 外层（含页面）滚动、容器尺寸变化时，容器在视口中的位置随之变化
			offs.push(ScrollerManager.subscribe(el.parentNode, update, { window: true }).off);
			offs.push(Resize.on(el, update, SHARED));
		}
		window.addEventListener('resize', update);
		offs.push(() => window.removeEventListener('resize', update));
		update();
	};

	// 进行中的回到顶部动画：再次点击、用户自己滚动、卸载时停止
	let motion: AbortController | undefined;
	const stopMotion = () => {
		motion?.abort();
		motion = undefined;
	};

	const scrollToTop = () => {
		stopMotion();
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

	// 切换 portal 后锚点变了，重新查找滚动容器
	watch(() => props.portal, bind, { flush: 'post' });
	watch(() => [props.visibilityHeight, props.showProgress], update);
	rem && watch(rem, update);

	onMounted(bind);

	// KeepAlive：按钮在 body 中不随页面移走，失活时隐藏并停止监听，激活后重新判断
	onDeactivated(() => {
		isActive = false;
		stopMotion();
		update();
		unbind();
	});
	onActivated(() => {
		if (isActive) return;
		isActive = true;
		bind();
	});

	onBeforeUnmount(() => {
		stopMotion();
		unbind();
	});

	// 重新查找滚动容器并判断是否显示（如滚动容器由外部替换后）
	const refresh = bind;
	expose({ refresh, visible });

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

	return () => {
		if (!props.portal) return renderButton();
		return [
			<span ref={placeholder} class="vc-back-top__placeholder" />,
			<Teleport to="body">{renderButton()}</Teleport>
		];
	};
};
