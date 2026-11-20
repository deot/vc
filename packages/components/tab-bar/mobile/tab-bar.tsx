/** @jsxImportSource vue */

import { defineComponent, provide, ref, shallowRef, triggerRef, watch, nextTick, computed } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import { props as tabBarProps } from './tab-bar-props';
import type { TabBarOption, TabBarTo, TabBarValue } from './tab-bar-item-props';
import { MTabBarItem } from './tab-bar-item';
import { VcInstance } from '../../vc';

const COMPONENT_NAME = 'vcm-tab-bar';
const HTTP_REGEX = /^[a-z][a-z\d+\-.]*:\/\//i;

// data 项里交给 MTabBarItem 的字段；其余业务字段（如 path）只在插槽的 item 里出现，不落到 DOM 上
const ITEM_KEYS = ['value', 'label', 'icon', 'activeIcon', 'badge', 'to', 'disabled', 'class', 'style'] as const;

const pick = (item: TabBarOption) => {
	const result: Record<string, any> = {};
	ITEM_KEYS.forEach((key) => {
		item[key] !== void 0 && (result[key] = item[key]);
	});
	return result;
};

/**
 * 跳转：全局钩子返回值不为 undefined 时视为已接管，否则函数直接调用、http 链接新窗口打开
 * @param to ~
 * @param instance 被点击的 MTabBarItem
 */
const navigate = (to: TabBarTo, instance: ComponentInternalInstance) => {
	const hook = VcInstance.options.MTabBar?.to;
	if (typeof hook === 'function' && typeof hook({ value: to, instance }) !== 'undefined') return;
	if (typeof to === 'function') {
		to();
	} else if (typeof to === 'string' && HTTP_REGEX.test(to)) {
		window.open(to);
	}
};

export const MTabBar = defineComponent({
	name: COMPONENT_NAME,
	props: tabBarProps,
	emits: ['update:modelValue', 'change', 'click'],
	setup(props, { slots, emit }) {
		const currentValue = ref<TabBarValue | undefined>(props.modelValue);
		watch(() => props.modelValue, (v) => {
			currentValue.value = v;
		});

		// 已注册的标签项，按 DOM 顺序；value 缺省时取它在这里的序号
		const items = shallowRef<ComponentInternalInstance[]>([]);
		let sorting = false;
		const sort = () => {
			if (sorting) return;
			sorting = true;
			nextTick(() => {
				sorting = false;
				const list = items.value.slice();
				list.sort((a, b) => {
					return (a.vnode.el as Node).compareDocumentPosition(b.vnode.el as Node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
				});
				if (list.some((item, index) => item !== items.value[index])) {
					items.value = list;
				}
			});
		};
		const register = (instance: ComponentInternalInstance) => {
			items.value.push(instance);
			triggerRef(items);
		};
		const unregister = (instance: ComponentInternalInstance) => {
			const index = items.value.indexOf(instance);
			if (index === -1) return;
			items.value.splice(index, 1);
			triggerRef(items);
		};

		const getValue = (instance: ComponentInternalInstance) => {
			const value = (instance.props as any).value as TabBarValue | undefined;
			return value ?? items.value.indexOf(instance);
		};

		// 选中值：未传 v-model 时取第一项
		const activeValue = computed(() => {
			if (currentValue.value !== void 0) return currentValue.value;
			const first = items.value[0];
			return first ? getValue(first) : void 0;
		});

		const change = (instance: ComponentInternalInstance) => {
			const value = getValue(instance);
			emit('click', value);
			if (value === activeValue.value) return;

			currentValue.value = value;
			emit('update:modelValue', value);
			emit('change', value);

			const { to } = instance.props as any;
			to !== void 0 && to !== null && navigate(to, instance);
		};

		provide('vc-tab-bar', {
			props,
			slots,
			items,
			activeValue,
			getValue,
			register,
			unregister,
			sort,
			change
		});

		return () => {
			const { fixed, placeholder, zIndex, data } = props;
			const safeArea = props.safeArea ?? fixed;
			return (
				<div
					class={[
						COMPONENT_NAME,
						{
							'is-fixed': fixed,
							'is-placeholder': fixed && placeholder,
							'is-safe-area': safeArea
						}
					]}
				>
					<div
						class="vcm-tab-bar__wrapper"
						role="tablist"
						style={fixed && zIndex !== void 0 ? { zIndex } : void 0}
					>
						{
							data
								? data.map((item, index) => (
										<MTabBarItem key={item.value ?? index} {...pick(item)} />
									))
								: slots.default?.()
						}
					</div>
				</div>
			);
		};
	}
});
