/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, ref, computed, nextTick } from 'vue';
import { props as tabsProps } from './tabs-props';
import { Icon } from '../icon';
import { Customer } from '../customer';
import useTabs from './use-tabs';

const COMPONENT_NAME = 'vc-tabs';

export const Tabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	emits: ['update:modelValue', 'change', 'click'],
	setup(props, { slots }) {
		const instance = getCurrentInstance()!;
		const wrapper = ref<any>(null);
		const content = ref<any>(null);
		const scroll = ref<any>(null);
		const nav = ref<any>(null);
		// eslint-disable-next-line prefer-const
		let tabs: any;

		/**
		 * 刷新是否需要滚动条
		 */
		const refreshScroll = () => {
			// 容器
			const boxWidth = scroll.value.offsetWidth;
			// 总长度
			const totalWidth = nav.value.offsetWidth;

			if (boxWidth < totalWidth) {
				tabs.scrollable.value = true;
				(totalWidth - tabs.scrollOffset.value < boxWidth) && (
					tabs.scrollOffset.value = totalWidth - boxWidth
				);
			} else {
				tabs.scrollable.value = false;
				tabs.scrollOffset.value > 0 && (tabs.scrollOffset.value = 0);
			}
		};

		/**
		 * 刷新当前标签底下的滑块位置
		 */
		const refreshAfloat = () => {
			nextTick(() => {
				const index = tabs.getTabIndex(tabs.currentValue.value);
				if (instance.isUnmounted) return;
				const items = nav.value.querySelectorAll(`.vc-tabs__item`);

				const $ = items[index];

				tabs.afloatWidth.value = $ ? parseFloat($.offsetWidth) : 0;

				if (!Array.from(items).length) return;
				let offset = 0;
				if (index > 0) {
					const gutter = 16; // margin-right -> 16px
					for (let i = 0; i < index; i++) {
						offset += parseFloat(items[i].offsetWidth) + gutter;
					}
				}

				tabs.afloatOffset.value = offset;

				refreshScroll();
			});
		};

		const scrollToActive = () => {
			if (!tabs.scrollable.value) return;
			// 这里不直接选择is-active,存在延迟
			const $ = instance.vnode.el!.querySelector(`.vc-tabs__item[name="${tabs.currentValue.value}"]`);

			if (!$) return;

			const itemBounding = $.getBoundingClientRect();
			const scrollBounding = scroll.value.getBoundingClientRect();
			const navBounding = nav.value.getBoundingClientRect();

			let offset: any;

			if (navBounding.right < scrollBounding.right) {
				offset = nav.value.offsetWidth - scrollBounding.width;
			}

			if (itemBounding.left < scrollBounding.left) {
				offset = tabs.scrollOffset.value - (scrollBounding.left - itemBounding.left);
			} else if (itemBounding.right > scrollBounding.right) {
				offset = tabs.scrollOffset.value + itemBounding.right - scrollBounding.right;
			}

			if (tabs.scrollOffset.value !== offset) {
				tabs.scrollOffset.value = offset;
			}
		};

		tabs = useTabs({
			content,
			wrapper,
			refreshAfloat,
			refreshScroll,
			scrollToActive
		});
		/**
		 * 上一个
		 */
		const handlePrev = () => {
			const boxWidth = scroll.value.offsetWidth;

			if (!tabs.scrollOffset.value) return;

			tabs.scrollOffset.value = tabs.scrollOffset.value > boxWidth
				? tabs.scrollOffset.value - boxWidth
				: 0;
		};

		/**
		 * 下一个
		 */
		const handleNext = () => {
			const boxWidth = scroll.value.offsetWidth;
			const totalWidth = nav.value.offsetWidth;

			if (totalWidth - tabs.scrollOffset.value <= boxWidth) return;

			tabs.scrollOffset.value = totalWidth - tabs.scrollOffset.value > boxWidth * 2
				? tabs.scrollOffset.value + boxWidth
				: (totalWidth - boxWidth);
		};

		const scrollStyle = computed(() => {
			const style = {
				transform: `translate3d(${-tabs.scrollOffset.value}px, 0px, 0px)`
			};

			return style;
		});

		const isCard = computed(() => {
			return props.type === 'card';
		});
		return () => {
			return (
				<div class={[tabs.classes.value, 'vc-tabs']}>
					<div class="vc-tabs__extra">
						{ slots.extra?.() }
					</div>
					<div ref={wrapper} style={{ padding: tabs.scrollable.value && '0 24px' }} class="vc-tabs__bar">
						{
							tabs.scrollable.value && (
								<Icon
									class="vc-tabs__icon is-left"
									type="left"
									// @ts-ignore
									onClick={handlePrev}
								/>
							)
						}
						{
							tabs.scrollable.value && (
								<Icon
									class="vc-tabs__icon is-right"
									type="right"
									// @ts-ignore
									onClick={handleNext}
								/>
							)
						}

						<div ref={scroll} class="vc-tabs__scroll">
							<div ref={nav} style={scrollStyle.value} class="vc-tabs__nav">
								{ !isCard.value && <div style={tabs.afloatStyle.value} class="vc-tabs__afloat" /> }
								{
									tabs.list.value.map((item, index) => {
										return (
											<div
												key={index}
												class={[{ 'is-active': (item.value || index) == tabs.currentValue.value }, 'vc-tabs__item']}
												onClick={() => tabs.handleChange(index)}
											>
												{
													slots.label
														? slots.label({ it: item, index, })
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
												{ /* TODO */ }
												{ props.closable && item.closable && <Icon type="close" /> }
											</div>
										);
									})
								}
							</div>
						</div>
					</div>
					<div
						ref={content}
						style={tabs.contentStyle.value}
						class="vc-tabs__content"
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
