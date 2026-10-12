import { defineComponent, getCurrentInstance, h, toRaw } from 'vue';
import { Customer } from './customer';

const COMPONENT_NAME = 'vc-customer-prop';

/**
 * 内容取自 source[name]，在自己的渲染里读取后交给 Customer；render 有值时优先（如同名插槽）。
 * 父组件根据子项的属性渲染时使用（Tabs 的标签、Carousel 的指示点）：
 * 子项的属性由父组件渲染默认插槽时赋值，内联的函数或 { type, value } 每次都是新引用，
 * 放在父组件自身的渲染里读取会循环更新
 */
const CustomerProp$ = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: ['source', 'name', 'render'],
	setup(props) {
		// 原始对象：读取没有响应式开销；source 自身是响应式的，它的属性照常被追踪
		const { attrs } = getCurrentInstance()!;
		const rawProps = toRaw(props);

		return () => h(Customer, { ...attrs, render: rawProps.render || rawProps.source[rawProps.name] });
	}
});

// 其余 attrs 原样交给 Customer，类型上放开
export const CustomerProp = CustomerProp$ as typeof CustomerProp$ & { new (): { $props: Record<string, any> } };
