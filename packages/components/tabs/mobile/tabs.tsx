/** @jsxImportSource vue */

import { defineComponent, ref, computed, onUnmounted, onMounted, watch } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as tabsProps } from './tabs-props';
import { MIcon } from '../../icon/index.m';
import { MAffix } from '../../affix/index.m';
import { CustomerProp } from '../../customer/customer-prop';
import { Scroller } from '../../scroller';
import { useTabs } from '../use-tabs';
import { useTabsScroll } from '../use-tabs-scroll';
import { useTabsSwipe } from './use-tabs-swipe';

const COMPONENT_NAME = 'vcm-tabs';
const SHARED = { shared: true };

export const MTabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	emits: ['update:modelValue', 'change', 'click', 'tab-remove'],
	setup(props, context) {
		const { slots } = context;
		const content = ref<any>(null);
		const scroller = ref<any>(null);

		const isDark = computed(() => {
			return props.theme === 'dark';
		});

		// eslint-disable-next-line prefer-const
		let tabs: any;

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

		tabs = useTabs(props, context, {
			content,
			refreshAfloat,
			scrollToActive: () => scroll.scrollToActive()
		});

		const swipe = useTabsSwipe({
			enabled: () => props.swipeable,
			getIndex: () => tabs.getTabIndex(tabs.currentValue.value),
			getCount: () => tabs.list.value.length,
			isDisabled: index => !!tabs.list.value[index]?.disabled,
			change: index => tabs.handleChange(index, { click: false })
		});

		// 可视区或标签尺寸变化：立即刷新，不播放动画
		const handleResize = () => {
			refreshAfloat();
			scroll.scrollToActive(false);
		};

		onMounted(() => {
			[scroller.value?.wrapper, getNav()].forEach(el => el && Resize.on(el, handleResize, SHARED));
		});

		onUnmounted(() => {
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
								<MIcon
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
					<MIcon type={name === 'prev' ? 'left' : 'right'} />
				</div>
			);
		};

		// 标签栏；吸顶中（active）带 is-fixed
		const renderBar = ({ active }: { active: boolean }) => {
			return (
				<div
					style={props.barStyle as any}
					class={[{ 'is-fixed': active }, 'vcm-tabs__bar']}
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
			);
		};

		// sticky：标签栏由 MAffix（position: sticky）吸附在所在滚动容器（页面或内层容器）的顶部，
		// 吸附范围为 Tabs 自身，内容滚出后随之离开；不吸顶时 MAffix 直接渲染标签栏
		return () => {
			return (
				<div class={[tabs.classes.value, 'vcm-tabs']}>
					{
						props.showWrapper && (
							<MAffix
								disabled={!props.sticky}
								fixed={false}
								offset={props.offsetTop}
								zIndex={999}
							>
								{{ default: renderBar }}
							</MAffix>
						)
					}
					<div
						ref={content}
						class="vcm-tabs__content"
						{...(props.swipeable ? swipe.listeners : {})}
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
