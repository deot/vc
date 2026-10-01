import { defineComponent, inject, provide } from 'vue';

const COMPONENT_NAME = 'vc-measuring';

// 用字符串作 key：应用里同时存在多份组件库代码（各自打包）时仍然对得上
const MEASURING_KEY = 'vc-measuring';

/**
 * 测量范围：默认插槽里的内容只为量出尺寸而渲染，不会展示（如虚拟列表的隐藏测量池）
 *
 * 自身不生成元素；里面的组件用 useMeasuring() 得知这一点，据此跳过与尺寸无关的副作用
 */
export const Measuring = defineComponent({
	name: COMPONENT_NAME,
	setup(_, { slots }) {
		provide(MEASURING_KEY, true);
		return () => slots.default?.();
	}
});

/**
 * 当前组件是否渲染在测量范围（Measuring）里
 *
 * 为 true 时可以跳过与尺寸无关的副作用（发请求、登记、监听等），但渲染出来的尺寸要与正常展示时一致
 * @returns 是否处于测量中
 */
export const useMeasuring = () => inject(MEASURING_KEY, false);
