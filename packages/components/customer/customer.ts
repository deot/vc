import { computed, defineComponent, getCurrentInstance, h, toRaw } from 'vue';
import type { ComponentInternalInstance, ComputedRef } from 'vue';
import { VcInstance } from '../vc';
import { props as customerProps } from './customer-props';
import type { Props } from './customer-props';
import { getCustomerContent, isCustomerData as isData, isEmpty } from './utils';
import type { CustomerData, CustomerRender, CustomerValue } from './types';

const COMPONENT_NAME = 'vc-customer';

type Attrs = Record<string, unknown>;

// class / style / 事件监听（on 后接非小写字母）属于包裹元素
const isWrapperAttr = (key: string) => {
	if (key === 'class' || key === 'style') return true;
	const code = key.charCodeAt(2);
	return key.charCodeAt(0) === 111 && key.charCodeAt(1) === 110 && (code > 122 || code < 97);
};

// 没有声明为属性、按约定从 attrs 读取的开关：既不属于包裹元素，也不是函数的参数
const isOption = (key: string) => key === 'tag' || key === 'wrap';

// 模板里的裸属性（<Customer wrap />）传进来是空字符串
const isWrap = (attrs: Attrs) => attrs.wrap === '' || !!attrs.wrap;

// 不含 < 和 & 的内容，按 HTML 解析的结果就是同一段文本
const hasMarkup = (v: string) => v.indexOf('<') !== -1 || v.indexOf('&') !== -1;

// isWrapper 为 true 时取包裹元素的属性，否则取函数的参数
const pickAttrs = (attrs: Attrs, isWrapper: boolean) => {
	const result: Attrs = {};
	for (const key in attrs) {
		isWrapperAttr(key) === isWrapper && !isOption(key) && (result[key] = attrs[key]);
	}
	return result;
};

// tag 为组件时，内容以插槽传入
const renderTag = (attrs: Attrs, children?: any, innerHTML?: string) => {
	const tag: any = attrs.tag || 'div';
	const data = pickAttrs(attrs, true);
	innerHTML !== void 0 && (data.innerHTML = innerHTML);
	return h(tag, data, typeof tag === 'string' || children === void 0 ? children : () => children);
};

// { type, value } 经过 formatter、html 再经过 sanitize 之后的内容，结果按实例记忆
const createFormatted = (props: { readonly render?: CustomerValue }, instance: ComponentInternalInstance) => {
	// 内联的 { type, value } 每次渲染都是新对象：内容没变时沿用上一个，下面不重算
	const data = computed<CustomerData | undefined>((prev) => {
		const { render } = props;
		if (!isData(render)) return;
		return prev && prev.type === render.type && prev.value === render.value ? prev : render;
	});
	return computed(() => {
		const current = data.value;
		if (!current || isEmpty(current.value)) return;

		const isHtml = current.type === 'html';
		let value = isHtml ? `${current.value}` : current.value;
		// 重算时配置可能已被移除
		const formatter = VcInstance.options.Customer?.formatter;
		formatter && (value = formatter({ type: current.type, value, instance }));
		const { sanitize } = VcInstance.options;
		return isHtml && sanitize && hasMarkup(`${value}`) ? sanitize({ value: `${value}`, instance }) : value;
	});
};

/**
 * 内容的统一渲染入口：渲染函数（插槽也是函数）→ 字符串 / { type, value }
 * 组件库内只有这里写入 innerHTML
 */
const Customer$ = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: customerProps,
	setup(props, context) {
		const instance = getCurrentInstance()!;
		// 原始对象：读取没有响应式开销。render 与 attrs 只会随父级更新而变化，届时本组件必然重新渲染，不需要依赖追踪
		const { attrs } = instance;
		const rawProps = toRaw(props);

		// 配置了 formatter 或 sanitize 才创建
		let formatted: ComputedRef<any> | undefined;

		// 渲染函数的内容不包裹，wrap 时才放进包裹元素
		const renderFunction = (render: CustomerRender) => {
			const children = render(pickAttrs(attrs, false), context);
			return isWrap(attrs) ? renderTag(attrs, children) : children;
		};

		// 字符串与数字就是文本，不经过任何钩子；HTML 与自定义类型用 { type, value } 声明
		const renderContent = (render: CustomerValue | undefined) => {
			const data = isData(render);
			const isHtml = data && render.type === 'html';
			let content: unknown = getCustomerContent(render);
			if (data && !isEmpty(content)) {
				const { options } = VcInstance;
				// 先判断 sanitize：需要清洗时不必在这里再读 formatter，它由 computed 自己追踪
				const needsHooks = (isHtml && options.sanitize && hasMarkup(`${content}`)) || options.Customer?.formatter;
				needsHooks && (content = (formatted ||= createFormatted(props, instance)).value);
			}

			if (isEmpty(content)) {
				return isWrap(attrs) ? renderTag(attrs) : null;
			}

			const text = `${content}`;
			return isHtml && hasMarkup(text) ? renderTag(attrs, void 0, text) : renderTag(attrs, text);
		};

		return () => {
			const { render } = rawProps;
			return typeof render === 'function' ? renderFunction(render) : renderContent(render);
		};
	}
});

// tag / wrap 从 attrs 读取，类型在 Props 里补上；其余 attrs 都会传给 render，类型上放开
export const Customer = Customer$ as typeof Customer$ & { new (): { $props: Props & Record<string, any> } };
