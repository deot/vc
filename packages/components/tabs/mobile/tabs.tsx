/** @jsxImportSource vue */

import { defineComponent, ref, computed, onUnmounted, onMounted, onUpdated, watch } from 'vue';
import { throttle, debounce } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
import { remToPx } from '@deot/vc-shared';
import { props as tabsProps } from './tabs-props';
import { Icon } from '../../icon';
import { CustomerProp } from '../../customer/customer-prop';
import { Scroller } from '../../scroller';
import useTabs from '../use-tabs';
import { useTabsScroll } from '../use-tabs-scroll';

const COMPONENT_NAME = 'vcm-tabs';
const SHARED = { shared: true };

export const MTabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	emits: ['update:modelValue', 'change', 'click', 'tab-remove'],
	setup(props, { slots }) {
		const bar = ref<HTMLElement>();
		const content = ref<any>(null);
		const scroller = ref<any>(null);

		const top = ref(0);
		const isFixed = ref(false);
		// 吸顶时占位的高度（标签栏高度 + 下边距）；固定后标签栏仍是同一个盒子，可随时量取
		const placeholderH = ref(0);
		// offsetTop（750 稿）换算后的 px，随 refreshTop 更新
		let offsetTopPx = 0;

		const isDark = computed(() => {
			return props.theme === 'dark';
		});

		const fixedStyle = computed(() => {
			return isFixed.value
				? { top: `calc(var(--vc-rem) * ${props.offsetTop})` }
				: {};
		});

		// eslint-disable-next-line prefer-const
		let tabs: any;

		// TODO: 找到父层滚动条
		const handleScroll = throttle(() => {
			const el = document.scrollingElement || document.documentElement;
			isFixed.value = (el?.scrollTop || 0) + offsetTopPx > top.value;
		}, 100);

		/**
		 * 使用Resize时, 切换页面失效，换种方案
		 */
		const refreshTop = debounce(() => {
			if (props.sticky && content.value) {
				if (bar.value) {
					placeholderH.value = bar.value.offsetHeight + (parseFloat(getComputedStyle(bar.value).marginBottom) || 0);
				}
				offsetTopPx = remToPx(content.value, props.offsetTop);
				top.value = content.value.offsetTop - placeholderH.value;
				const el = document.scrollingElement || document.documentElement;
				isFixed.value = (el?.scrollTop || 0) + offsetTopPx > top.value;
			}
		}, 250, { leading: true, trailing: true });

		// 标签的容器即 Scroller 的 content；滑块放在标签之后，标签的下标与子元素一致
		const getNav = () => scroller.value?.content as HTMLElement | undefined;
		// 面板刚注册时标签可能还没渲染（导航里只有滑块）：只取标签项，渲染后由 Resize 再刷新
		const getActiveItem = () => {
			const index = tabs.getTabIndex(tabs.currentValue.value);
			const el = index === -1 ? undefined : getNav()?.children[index] as HTMLElement | undefined;
			return el?.classList.contains('vcm-tabs__item') ? el : undefined;
		};

		/**
		 * 刷新当前标签底下的滑块：light 默认按标签文字（span）的宽度，居中于标签；
		 * dark 取整个标签宽度，短条由样式居中绘制（宽度随 --vc-rem）
		 */
		const refreshAfloat = () => {
			const $ = getActiveItem();
			const width = !$
				? 0
				: props.autoAfloatWidth && !isDark.value
					? ($.firstElementChild as HTMLElement).offsetWidth
					: $.offsetWidth;
			tabs.afloatWidth.value = width;
			tabs.afloatOffset.value = $ ? $.offsetLeft + ($.offsetWidth - width) / 2 : 0;
		};

		// 原生横向滚动（触摸自带惯性）；选中项尽量居中
		const scroll = useTabsScroll({
			scroller,
			vertical: () => false,
			getActiveItem,
			align: 'center'
		});

		tabs = useTabs({
			content,
			refreshAfloat,
			scrollToActive: () => scroll.scrollToActive()
		});

		// 可视区或标签尺寸变化：立即刷新，不播放动画
		// 视口宽度变化时尺寸随 --vc-rem 缩放，吸顶位置一并重算
		const handleResize = () => {
			refreshAfloat();
			scroll.scrollToActive(false);
			refreshTop();
		};

		/**
		 * TODO: 在height: 100%容器内滚动，让其带有粘性
		 * @param type ~
		 */
		const operateDOMEvents = (type: string) => {
			if (!props.sticky) return;
			const fn = type === 'add' ? window.addEventListener : window.removeEventListener;
			fn('scroll', handleScroll);
		};

		onMounted(() => {
			refreshTop();
			operateDOMEvents('add');
			[scroller.value?.wrapper, getNav()].forEach(el => el && Resize.on(el, handleResize, SHARED));
		});

		onUpdated(refreshTop);

		onUnmounted(() => {
			operateDOMEvents('remove');
			Resize.disconnect(handleResize);
		});

		// 外观变化后按新的样式重新计算滑块
		watch(
			[() => props.theme, () => props.average, () => props.autoAfloatWidth],
			refreshAfloat,
			{ flush: 'post' }
		);

		// 标签列表作为 Scroller 的稳定插槽：只由 Scroller 收集依赖
		const renderNav = () => {
			const nodes = tabs.list.value.map((item: any, index: number) => {
				return (
					<div
						key={index}
						class={[
							{
								'is-active': tabs.getTabPaneValue(item, index) === tabs.currentValue.value,
								'is-average': props.average,
								'is-disabled': item.disabled
							},
							'vcm-tabs__item'
						]}
						onClick={() => tabs.handleChange(index)}
					>
						<CustomerProp
							wrap
							tag="span"
							render={slots.label}
							source={item}
							name="label"
							row={item}
							it={item}
							index={index}
						/>
						{
							props.closable && item.closable && (
								<Icon
									class="vcm-tabs__close"
									type="close"
									// @ts-ignore
									onClick={(e: MouseEvent) => {
										e.stopPropagation();
										tabs.handleRemove(index);
									}}
								/>
							)
						}
					</div>
				);
			});
			props.afloat && nodes.push(<div key="afloat" style={tabs.afloatStyle.value} class="vcm-tabs__afloat" />);
			return nodes;
		};

		const renderStepper = (name: 'prev' | 'next') => {
			if (!props.stepper || !scroll.scrollable.value) return;
			return (
				<div class={['vcm-tabs__stepper', `is-${name}`]} onClick={() => scroll.step(name === 'prev' ? -1 : 1)}>
					<Icon type={name === 'prev' ? 'left' : 'right'} />
				</div>
			);
		};

		return () => {
			return (
				<div class={[tabs.classes.value, 'vcm-tabs']}>
					{
						props.showWrapper && (
							<div
								ref={bar}
								style={[props.barStyle as any, fixedStyle.value]}
								class={[{ 'is-fixed': isFixed.value }, 'vcm-tabs__bar']}
							>
								{ slots.prepend?.() }
								{ renderStepper('prev') }
								<Scroller
									ref={scroller}
									class="vcm-tabs__scroll"
									contentClass="vcm-tabs__nav"
									axis="x"
									native={false}
									showBar={false}
								>
									{{ default: renderNav, $stable: true }}
								</Scroller>
								{ renderStepper('next') }
								{ slots.append?.() }
							</div>
						)

					}
					{
						isFixed.value && (
							<div style={{ height: `${placeholderH.value}px` }} class="vcm-tabs__placeholder" />
						)
					}
					<div
						ref={content}
						class="vcm-tabs__content"
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
