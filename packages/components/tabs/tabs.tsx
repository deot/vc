/** @jsxImportSource vue */

import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as tabsProps } from './tabs-props';
import { Icon } from '../icon';
import { CustomerProp } from '../customer/customer-prop';
import { Scroller } from '../scroller';
import useTabs from './use-tabs';
import { useTabsScroll } from './use-tabs-scroll';

const COMPONENT_NAME = 'vc-tabs';
const SHARED = { shared: true };

// 前后翻页按钮：[方向, 横向图标, 纵向图标]
const STEPPERS = {
	prev: [-1, 'left', 'up'],
	next: [1, 'right', 'down']
} as const;

export const Tabs = defineComponent({
	name: COMPONENT_NAME,
	props: tabsProps,
	emits: ['update:modelValue', 'change', 'click', 'tab-remove'],
	setup(props, { slots }) {
		const content = ref<any>(null);
		const scroller = ref<any>(null);
		// eslint-disable-next-line prefer-const
		let tabs: any;

		// 标签的容器即 Scroller 的 content；滑块放在标签之后，标签的下标与子元素一致
		const getNav = () => scroller.value?.content as HTMLElement | undefined;
		// 面板刚注册时标签可能还没渲染（导航里只有滑块）：只取标签项，渲染后由 Resize 再刷新
		const getActiveItem = () => {
			const index = tabs.getTabIndex(tabs.currentValue.value);
			const el = index === -1 ? undefined : getNav()?.children[index] as HTMLElement | undefined;
			return el?.classList.contains('vc-tabs__item') ? el : undefined;
		};

		/**
		 * 刷新当前标签旁的滑块位置：按激活项在nav中的位置，不依赖项的间距
		 */
		const refreshAfloat = () => {
			const $ = getActiveItem();
			const vertical = tabs.isVertical.value;
			tabs.afloatWidth.value = $ ? (vertical ? $.offsetHeight : $.offsetWidth) : 0;
			tabs.afloatOffset.value = $ ? (vertical ? $.offsetTop : $.offsetLeft) : 0;
		};

		const scroll = useTabsScroll({
			scroller,
			vertical: () => tabs.isVertical.value,
			getActiveItem
		});

		tabs = useTabs({
			content,
			refreshAfloat,
			scrollToActive: () => scroll.scrollToActive()
		});

		// 可视区或标签尺寸变化（翻页按钮出现、容器缩放、切换类型等）：立即刷新，不播放动画
		const handleResize = () => {
			refreshAfloat();
			scroll.scrollToActive(false);
		};

		onMounted(() => {
			[scroller.value?.wrapper, getNav()].forEach(el => el && Resize.on(el, handleResize, SHARED));
		});

		onBeforeUnmount(() => {
			Resize.disconnect(handleResize);
		});

		// 只有line有滑块
		const isLine = computed(() => {
			return props.type === 'line';
		});

		const renderStepper = (name: keyof typeof STEPPERS) => {
			if (!props.stepper || !scroll.scrollable.value) return;
			const [direction, icon, verticalIcon] = STEPPERS[name];
			const isDisabled = name === 'prev' ? scroll.isStart.value : scroll.isEnd.value;
			return (
				<span
					class={['vc-tabs__stepper', `is-${name}`, { 'is-disabled': isDisabled }]}
					onClick={() => scroll.step(direction)}
				>
					<Icon type={tabs.isVertical.value ? verticalIcon : icon} />
				</span>
			);
		};

		// 标签列表作为 Scroller 的稳定插槽：只由 Scroller 收集依赖，根节点重新渲染时不重建标签
		const renderNav = () => {
			const nodes = tabs.list.value.map((item: any, index: number) => {
				const value = tabs.getTabPaneValue(item, index);
				// 禁用的面板不能关闭
				const isClosable = props.closable && item.closable && !item.disabled;
				return (
					<div
						key={index}
						class={[
							{
								'is-active': value === tabs.currentValue.value,
								'is-disabled': item.disabled,
								'is-closable': isClosable
							},
							'vc-tabs__item'
						]}
						onClick={() => tabs.handleChange(index)}
					>
						<CustomerProp
							tag="span"
							render={slots.label}
							source={item}
							name="label"
							row={item}
							it={item}
							index={index}
						/>
						{
							isClosable && (
								<span
									class="vc-tabs__close"
									onClick={(e: MouseEvent) => {
										e.stopPropagation();
										tabs.handleRemove(index);
									}}
								>
									<Icon type="close" />
								</span>
							)
						}
					</div>
				);
			});
			isLine.value && nodes.push(<div key="afloat" style={tabs.afloatStyle.value} class="vc-tabs__afloat" />);
			return nodes;
		};

		return () => {
			return (
				<div class={[tabs.classes.value, 'vc-tabs']}>
					<div
						style={props.barStyle}
						class={[props.barClass, 'vc-tabs__bar']}
					>
						{ renderStepper('prev') }
						<Scroller
							ref={scroller}
							class="vc-tabs__scroll"
							contentClass="vc-tabs__nav"
							axis={scroll.axis.value}
							native={false}
							showBar={false}
						>
							{{ default: renderNav, $stable: true }}
						</Scroller>
						{ renderStepper('next') }
						{
							slots.extra && (
								<div class="vc-tabs__extra">
									{ slots.extra() }
								</div>
							)
						}
					</div>
					<div
						ref={content}
						style={props.contentStyle}
						class={[props.contentClass, 'vc-tabs__content']}
					>
						{ slots.default?.() }
					</div>
				</div>
			);
		};
	}
});
