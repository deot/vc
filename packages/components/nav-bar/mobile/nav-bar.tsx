/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, ref, shallowRef, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRem } from '@deot/vc-hooks';
import { props as navBarProps } from './nav-bar-props';
import type { NavBarScroller } from './nav-bar-props';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { useLocale } from '../../locale';
import { getScroller, getScrollingElement, isWindow } from '../../scroller/utils';
import { VcInstance } from '../../vc';
import { resolvePortalElement } from '../../portal/utils';

const COMPONENT_NAME = 'vcm-nav-bar';
const PROGRESS_VAR = '--vc-nav-bar-progress';

export const MNavBar = defineComponent({
	name: COMPONENT_NAME,
	props: navBarProps,
	emits: ['back'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
		const { t } = useLocale();
		const rem = useRem({ element: resolvePortalElement() });

		const current = shallowRef<HTMLDivElement>();

		/**
		 * 不透明度 0–1：transparent 为 true 时恒为 0，为 false 时恒为 1，为数字时随滚动变化
		 * 滚动时只把它写进根节点的 CSS 变量（不重新渲染）；插槽用到时才在渲染中读取
		 */
		const progress = ref(props.transparent === true || typeof props.transparent === 'number' ? 0 : 1);

		let scroller: NavBarScroller | null | undefined;

		const getScrollTop = () => {
			if (!scroller) return 0;
			return isWindow(scroller) ? getScrollingElement(scroller).scrollTop : scroller.scrollTop;
		};

		// 精确到 0.01：只在跨档时写入，滚动中多数事件不改动样式
		const refresh = () => {
			const { transparent } = props;
			if (typeof transparent !== 'number') return;
			const distance = transparent * rem.value;
			const value = distance > 0
				? Math.round(Math.min(Math.max(getScrollTop() / distance, 0), 1) * 100) / 100
				: 1;
			if (value === progress.value && current.value?.style.getPropertyValue(PROGRESS_VAR)) return;
			progress.value = value;
			current.value?.style.setProperty(PROGRESS_VAR, String(value));
		};

		const unbind = () => {
			scroller?.removeEventListener('scroll', refresh);
			scroller = void 0;
			current.value?.style.removeProperty(PROGRESS_VAR);
		};

		const bind = () => {
			unbind();
			const { transparent } = props;
			if (typeof transparent !== 'number') {
				progress.value = transparent ? 0 : 1;
				return;
			}
			scroller = props.getScroller?.() || getScroller(current.value) || window;
			scroller.addEventListener('scroll', refresh, { passive: true });
			refresh();
		};

		onMounted(bind);
		onBeforeUnmount(unbind);
		watch(() => [props.transparent, props.getScroller], bind);
		watch(rem, refresh);

		/**
		 * 返回：先发出 back；没有监听时交给全局钩子，钩子返回值不为 undefined 视为已接管；
		 * 都没有处理时回到上一页
		 * @param e ~
		 */
		const handleBack = (e: Event) => {
			emit('back', e);
			if (instance.vnode.props?.onBack) return;
			const hook = VcInstance.options.MNavBar?.back;
			if (typeof hook === 'function' && typeof hook({ instance }) !== 'undefined') return;
			window.history.back();
		};

		const handleBackKeydown = (e: KeyboardEvent) => {
			if (e.key !== 'Enter' && e.key !== ' ') return;
			e.preventDefault();
			handleBack(e);
		};

		// 函数（含插槽）才收到 { progress }：读取 progress 会让滚动渐变时随之重新渲染，字符串内容不读
		const args = (value: unknown) => (typeof value === 'function' ? { progress: progress.value } : void 0);

		const renderBack = (ctx: Record<string, any>) => {
			const { back, backIcon } = props;
			if (back === false || back === null) return null;
			const text = back === true ? void 0 : back;
			const hasText = hasCustomerValue(text);
			return (
				<div
					class="vcm-nav-bar__back"
					role="button"
					tabindex={0}
					aria-label={slots.back || hasText ? void 0 : t('vc.NavBar.back')}
					onClick={handleBack}
					onKeydown={handleBackKeydown}
				>
					{
						slots.back
							? slots.back(ctx)
							: [
									backIcon && (<MIcon key="icon" type={backIcon} class="vcm-nav-bar__back-icon" />),
									hasText && (<MCustomer key="text" wrap tag="span" class="vcm-nav-bar__back-text" render={text} {...args(text)} />)
								]
					}
				</div>
			);
		};

		const renderTitle = () => {
			// 插槽也是函数，与渲染函数一样交给 MCustomer
			const title = slots.title || props.title;
			const subtitle = slots.subtitle || props.subtitle;
			return (
				<div class="vcm-nav-bar__title">
					{ hasCustomerValue(title) && (<MCustomer wrap class="vcm-nav-bar__title-text" render={title} {...args(title)} />) }
					{ hasCustomerValue(subtitle) && (<MCustomer wrap class="vcm-nav-bar__subtitle" render={subtitle} {...args(subtitle)} />) }
				</div>
			);
		};

		return () => {
			const { fixed, placeholder, zIndex, border, transparent } = props;
			const right = slots.right || props.right;
			const safeArea = props.safeArea ?? fixed;
			// 直接调用的插槽（back / left / default）的参数：progress 在读取时才取值（才被追踪）
			const ctx = {
				get progress() {
					return progress.value;
				}
			};

			return (
				<div
					ref={current}
					class={[
						COMPONENT_NAME,
						{
							'is-fixed': fixed,
							'is-placeholder': fixed && placeholder,
							'is-safe-area': safeArea,
							'is-border': border,
							'is-transparent': transparent === true,
							'is-scroll-linked': typeof transparent === 'number',
							'is-custom': !!slots.default
						}
					]}
				>
					<div
						class="vcm-nav-bar__wrapper"
						style={fixed && zIndex !== void 0 ? { zIndex } : void 0}
					>
						<div class="vcm-nav-bar__left">
							{ renderBack(ctx) }
							{ slots.left?.(ctx) }
						</div>
						{
							slots.default
								? (<div class="vcm-nav-bar__content">{slots.default(ctx)}</div>)
								: renderTitle()
						}
						<div class="vcm-nav-bar__right">
							{ hasCustomerValue(right) && (<MCustomer tag="span" render={right} {...args(right)} />) }
						</div>
					</div>
				</div>
			);
		};
	}
});
