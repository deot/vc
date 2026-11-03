/** @jsxImportSource vue */

import { defineComponent, ref, computed, onUnmounted, onMounted, onUpdated, watch } from 'vue';
import { throttle, debounce } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
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
		const content = ref<any>(null);
		const scroller = ref<any>(null);

		const top = ref(0);
		const isFixed = ref(false);
		const placeholderH = ref(53);

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
			const el = document.scrollingElement || document.documentElement;
			isFixed.value = (el?.scrollTop || 0) + props.offsetTop > top.value;
		}, 100);

		/**
		 * 使用Resize时, 切换页面失效，换种方案
		 */
		const refreshTop = debounce(() => {
			if (props.sticky && content.value) {
				top.value = content.value.offsetTop - placeholderH.value;
				const el = document.scrollingElement || document.documentElement;
				isFixed.value = (el?.scrollTop || 0) + props.offsetTop > top.value;
			}
		}, 250, { leading: true, trailing: true });

		// 标签的容器即 Scroller 的 content；滑块放在标签之后，标签的下标与子元素一致
		const getNav = () => scroller.value?.content as HTMLElement | undefined;
		const getActiveItem = () => {
			const index = tabs.getTabIndex(tabs.currentValue.value);
			return index === -1 ? undefined : getNav()?.children[index] as HTMLElement | undefined;
		};

		/**
		 * 刷新当前标签底下的滑块：dark 固定 20px，light 默认按标签文字（span）的宽度，居中于标签
		 */
		const refreshAfloat = () => {
			const $ = getActiveItem();
			const width = !$
				? 0
				: isDark.value
					? 20
					: props.autoAfloatWidth
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
		const handleResize = () => {
			refreshAfloat();
			scroll.scrollToActive(false);
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
