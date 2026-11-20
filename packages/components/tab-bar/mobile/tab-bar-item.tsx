/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, inject, onBeforeUnmount, onMounted } from 'vue';
import type { ComputedRef, ShallowRef, ComponentInternalInstance, Slots } from 'vue';
import { props as tabBarItemProps } from './tab-bar-item-props';
import type { TabBarBadge, TabBarIcon, TabBarValue } from './tab-bar-item-props';
import type { Props as TabBarProps } from './tab-bar-props';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { MBadge } from '../../badge/index.m';

const COMPONENT_NAME = 'vcm-tab-bar-item';

type TabBarContext = {
	props: TabBarProps;
	slots: Slots;
	items: ShallowRef<ComponentInternalInstance[]>;
	activeValue: ComputedRef<TabBarValue | undefined>;
	getValue: (instance: ComponentInternalInstance) => TabBarValue;
	register: (instance: ComponentInternalInstance) => void;
	unregister: (instance: ComponentInternalInstance) => void;
	sort: () => void;
	change: (instance: ComponentInternalInstance) => void;
};

// 数字、字符串为 value；true 为圆点；对象透传；其余不显示
const toBadgeProps = (badge?: TabBarBadge) => {
	if (badge === true) return { dot: true };
	if (typeof badge === 'number' || typeof badge === 'string') return { value: badge };
	if (badge && typeof badge === 'object') return badge;
	return {};
};

export const MTabBarItem = defineComponent({
	name: COMPONENT_NAME,
	props: tabBarItemProps,
	emits: ['click'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
		const tabBar = inject<TabBarContext | null>('vc-tab-bar', null);

		tabBar?.register(instance);
		onMounted(() => tabBar?.sort());
		onBeforeUnmount(() => tabBar?.unregister(instance));

		const handleClick = (e: MouseEvent) => {
			if (props.disabled) return;
			emit('click', e);
			tabBar?.change(instance);
		};

		const renderIcon = (icon: TabBarIcon | undefined, ctx: Record<string, any>) => {
			return typeof icon === 'string'
				? (<MIcon type={icon} />)
				: (<MCustomer render={icon} {...ctx} />);
		};

		return () => {
			const index = tabBar ? tabBar.items.value.indexOf(instance) : -1;
			const value = props.value ?? index;
			const active = !!tabBar && tabBar.activeValue.value === value;
			const data = tabBar?.props.data;
			// 插槽与渲染函数的参数：data 模式下 item 是原始数据项，否则是本组件的 props
			const ctx = { item: data ? data[index] : props, index, active };

			const parentSlots = tabBar?.slots || {};
			const custom = slots.default || parentSlots.item;
			const icon = slots.icon || parentSlots.icon || (active && props.activeIcon) || props.icon;
			const label = slots.label || parentSlots.label || props.label;
			const hasIcon = typeof icon === 'string' ? !!icon : hasCustomerValue(icon);
			const hasLabel = hasCustomerValue(label);
			const badge = toBadgeProps(props.badge);

			return (
				<div
					class={[
						'vcm-tab-bar__item',
						{
							'is-active': active,
							'is-disabled': props.disabled,
							'is-label-only': !custom && !hasIcon
						}
					]}
					role="tab"
					aria-selected={active}
					aria-disabled={props.disabled || void 0}
					onClick={handleClick}
				>
					{
						custom
							? custom(ctx)
							: [
									hasIcon && (
										<MBadge key="icon" class="vcm-tab-bar__icon" {...badge}>
											{ renderIcon(icon as TabBarIcon, ctx) }
										</MBadge>
									),
									hasLabel && (
										hasIcon
											? (<MCustomer key="label" wrap class="vcm-tab-bar__label" render={label} {...ctx} />)
											: (
													<MBadge key="label" class="vcm-tab-bar__label" {...badge}>
														<MCustomer tag="span" render={label} {...ctx} />
													</MBadge>
												)
									)
								]
					}
				</div>
			);
		};
	}
});
