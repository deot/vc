/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, ref, nextTick, computed, onUnmounted, onMounted, onUpdated, watch } from 'vue';
import { throttle, debounce } from 'lodash-es';
import { props as tabsProps } from './tabs-props';
import { Icon } from '../../icon';
import { Customer } from '../../customer';
import useTabs from '../use-tabs';

const COMPONENT_NAME = 'vcm-tabs';

export const MTabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	emits: ['update:modelValue', 'change', 'click'],
	setup(props, { slots }) {
		const instance = getCurrentInstance()!;
		const wrapper = ref<any>(null);
		const content = ref<any>(null);
		const scroll = ref<any>(null);
		const nav = ref<any>(null);

		const top = ref(0);
		const isFixed = ref(false);
		const placeholderH = ref(53);

		const startX = ref(0);

		const isTouching = ref(false);
		const scrollViewW = ref(0); // 滚动容器宽度
		const scrollContentW = ref(0); // 滚动内容宽度
		const baseX = ref(0);

		const isDark = computed(() => {
			return props.theme === 'dark';
		});

		const fixedStyle = computed(() => {
			return isFixed.value
				? { top: `${props.offsetTop}px` }
				: {};
		});

		// eslint-disable-next-line prefer-const
		let tabs: any;

		// TODO: 找到父层滚动条
		const handleScroll = throttle(() => {
			isFixed.value = document.scrollingElement!.scrollTop + props.offsetTop > top.value;
		}, 100);

		const handleTouchstart = (e: any) => {
			isTouching.value = true;
			startX.value = e.touches[0].pageX;
			baseX.value = tabs.scrollOffset.value;
		};

		const handleTouchmove = throttle((e: any) => {
			const touchPageX = e.touches[0].pageX;
			// 与touchstart时触点位置的距离偏移值，大于0时为触点向右移，反之向左
			const changedX = touchPageX - startX.value;
			if (changedX > 0) {
				if (tabs.scrollOffset.value >= 0) {
					tabs.scrollOffset.value = 0;
					return;
				}
			} else if (Math.abs(tabs.scrollOffset.value) + scrollViewW.value >= scrollContentW.value) {
				tabs.scrollOffset.value = -(scrollContentW.value - scrollViewW.value);
				return;
			}
			tabs.scrollOffset.value = baseX.value + touchPageX - startX.value;
		}, 17);

		const handleTouchend = () => {
			isTouching.value = false;
			// TODO: 惯性滚动、回弹 （体验优化）
		};

		const handleStep = (flag: number) => {
			if (!tabs.scrollable.value) return;
			const moveX = flag * scrollViewW.value;
			let offsetX = tabs.scrollOffset.value + moveX;
			if (offsetX < -(scrollContentW.value - scrollViewW.value) || offsetX > 0) {
				offsetX = flag === -1 ? -(scrollContentW.value - scrollViewW.value) : 0;
			}
			tabs.scrollOffset.value = offsetX;
		};

		/**
		 * 使用Resize时, 切换页面失效，换种方案
		 */
		const refreshTop = debounce(() => {
			if (props.sticky) {
				top.value = content.value!.offsetTop - placeholderH.value;
				isFixed.value = document.scrollingElement!.scrollTop + props.offsetTop > top.value;
			}
		}, 250, { leading: true, trailing: true });

		/**
		 * 将选中的item滚动至可视区（尽量往中间靠）
		 */
		const scrollToActive = () => {
			if (!tabs.scrollable.value) return;
			const activeEl = instance.vnode.el!.querySelector(`.vcm-tabs__item[data-id="${tabs.currentValue.value}"]`);

			if (!activeEl) return;
			const contentEl = nav.value;

			const activeRect = activeEl.getBoundingClientRect();
			const viewRect = scroll.value.getBoundingClientRect();
			const contentRect = contentEl.getBoundingClientRect();

			let offset = 0;

			if (activeRect.width < viewRect.width) {
				// targetOffset为最理想的情况下，可以滚动到正中间，此时activeEl距scrollView的左右边距
				const targetOffset = (viewRect.width - activeRect.width) / 2;
				// offsetLeft其实等价于activeEl.offsetLeft，
				// 但是调试时发现这两个值在小数位会有差距，offsetLeft一直是整数，所以还是决定用下面这种方式计算offsetLeft
				const offsetLeft = activeRect.left - contentRect.left;
				if (offsetLeft - viewRect.left <= targetOffset) { // 左边距离不足以到正中间的情况
					offset = 0;
				} else if (contentRect.right - activeRect.right <= targetOffset) { // 右边距离不足以到正中间的情况
					offset = viewRect.width - contentRect.width; // 负值
				} else {
					offset = targetOffset - offsetLeft; // 可以滚动到正中间的理想情况
				}
			}
			tabs.scrollOffset.value = offset;
		};

		const operateDOMScrollEvents = (type: string) => {
			const fn = type === 'add' ? window.addEventListener : window.removeEventListener;
			fn('scroll', handleScroll);

			fn('touchstart', handleTouchstart, false);
			fn('touchmove', handleTouchmove, false);
			fn('touchend', handleTouchend, false);
		};

		/**
		 * 处理是否需要滚动
		 */
		const refreshScroll = () => {
			const viewEl = scroll.value;
			scrollViewW.value = viewEl.offsetWidth;
			scrollContentW.value = nav.value.offsetWidth;
			if (scrollContentW.value > scrollViewW.value) {
				operateDOMScrollEvents('remove');
				operateDOMScrollEvents('add');
				tabs.scrollable.value = true;
			} else if (tabs.scrollable.value) {
				operateDOMScrollEvents('remove');
				tabs.scrollable.value = false;
			}
			tabs.scrollable.value && scrollToActive();
		};

		/**
		 * 刷新当前标签底下的滑块位置
		 */
		const refreshAfloat = () => {
			if (!props.showWrapper) return;

			nextTick(() => {
				const index = tabs.getTabIndex(tabs.currentValue.value);
				if (instance.isUnmounted) return;
				const items = nav.value.querySelectorAll(`.vcm-tabs__item`);

				const $ = items[index];

				// 暂时写死42
				tabs.afloatWidth.value = $
					? isDark.value
						? 20
						: props.autoAfloatWidth
							? $.querySelector('span').offsetWidth
							: $.offsetWidth
					: 0;

				if (!Array.from(items).length) return;
				let offset = 0;
				const basicOffset = $ ? ($.offsetWidth - tabs.afloatWidth.value) / 2 : 0;

				if (index > 0) {
					for (let i = 0; i < index; i++) {
						offset += parseFloat(items[i].offsetWidth);
					}
				}

				tabs.afloatOffset.value = offset + basicOffset;
				refreshScroll();
			});
		};

		/**
		 * TODO: 在height: 100%容器内滚动，让其带有粘性
		 * @param type ~
		 */
		const operateDOMEvents = (type) => {
			if (!props.sticky) return;
			const fn = type === 'add' ? window.addEventListener : window.removeEventListener;
			fn('scroll', handleScroll);
		};

		tabs = useTabs({
			content,
			wrapper,
			refreshAfloat,
			refreshScroll,
			scrollToActive
		});

		const scrollStyle = computed(() => {
			return {
				transition: isTouching.value ? '' : 'transform 300ms ease-in-out',
				transform: `translate3d(${tabs.scrollOffset.value}px, 0, 0)`
			};
		});

		onMounted(() => {
			refreshTop();
			operateDOMEvents('add');
			nextTick(refreshScroll);
		});

		onUpdated(refreshTop);

		onUnmounted(() => {
			operateDOMEvents('remove');
			operateDOMScrollEvents('remove');
		});

		watch(
			() => props.theme,
			refreshAfloat
		);

		watch(
			() => props.average,
			refreshAfloat
		);

		watch(
			() => props.showStep,
			() => nextTick(refreshScroll)
		);
		return () => {
			return (
				<div class={[tabs.classes.value, 'vcm-tabs']}>
					{
						props.showWrapper && (
							<div
								ref={wrapper}
								style={[props.barStyle as any, fixedStyle.value]}
								class={[{ 'is-fixed': isFixed }, 'vcm-tabs__bar']}
							>
								<slot name="prepend" />
								{ slots.prepend?.() }
								{
									props.showStep && tabs.scrollable.value && (
										<div class="vcm-tabs__step is-left" onClick={() => handleStep(1)}>
											<Icon type="left" />
										</div>
									)
								}
								<div
									ref={scroll}
									class="vcm-tabs__scroll"
								>
									<div ref={nav} style={scrollStyle.value} class="vcm-tabs__nav">
										{
											props.afloat && (
												<div
													style={tabs.afloatStyle.value}
													class="vcm-tabs__afloat"
												/>
											)
										}
										{
											tabs.list.value.map((item: any, index: number) => {
												return (
													<div
														key={index}
														data-id={item.value}
														class={[
															{
																'is-active': tabs.getTabPaneValue(item, index) === tabs.currentValue.value,
																'is-average': props.average
															},
															'vcm-tabs__item'
														]}
														onClick={() => tabs.handleChange(index)}
													>
														{
															slots.label
																? slots.label({ row: item, index, })
																: (
																		typeof item.label === 'string'
																			? <span innerHTML={item.label} />
																			: typeof item.label === 'function' && (
																				<Customer
																					render={item.label}
																					// @ts-ignore
																					it={item}
																					index={index}
																				/>
																			)
																	)
														}

													</div>
												);
											})
										}
									</div>
								</div>
								{
									props.showStep && tabs.scrollable.value && (
										<div class="vcm-tabs__step is-right" onClick={() => handleStep(-1)}>
											<Icon type="right" />
										</div>
									)
								}
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
						style={tabs.contentStyle.value}
						class="vcm-tabs__content"
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
