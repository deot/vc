import { h, defineComponent, ref, watch } from 'vue';
import type { ComponentOptions } from 'vue';
import { mount } from '@vue/test-utils';

// https://github.com/vuejs/core/blob/main/packages/runtime-core/__tests__/rendererAttrsFallthrough.spec.ts
describe('use-attrs.ts', () => {
	const ComponentSetup: ComponentOptions['setup'] = (props, { attrs }) => {
		const count = ref(0);
		const onClick = () => {
			count.value++;
		};
		/**
		 * https://cn.vuejs.org/guide/components/attrs.html#accessing-fallthrough-attributes-in-javascript
		 * 有变化仍然会响应，但文档好像说是不能的
		 */
		watch(
			() => attrs.any,
			() => {
				count.value++;
			}
		);

		return () => {
			return h(
				'div',
				{ onClick },
				h('span', attrs, `${(props as any).title}${count.value}`)
			);
		};
	};
	it('default behavior, inheritAttrs = true', async () => {
		const Wrapper = defineComponent(ComponentSetup, { props: ['title'] });
		const root = mount(Wrapper, {
			props: {
				title: 'title',
			},
			attrs: {
				any: 'any',
				class: 'class'
			}
		});

		expect(root.find('span').text()).toMatch(`title0`);
		expect(root.attributes()).toEqual({ class: 'class', any: 'any' }); // 由于设置了inheritAttrs=true
		expect(root.find('span').attributes()).toEqual({ class: 'class', any: 'any' }); // 由于使用了attrs

		await root.trigger('click');
		expect(root.find('span').text()).toMatch(`title1`);

		await root.setProps({ any: 'any-' } as any);
		expect(root.find('span').text()).toMatch(`title2`);
		expect(root.attributes()).toEqual({ class: 'class', any: 'any-' });
		expect(root.find('span').attributes()).toEqual({ class: 'class', any: 'any-' });
	});

	it('default behavior, inheritAttrs = false', async () => {
		const Wrapper = defineComponent(ComponentSetup, { inheritAttrs: false, props: ['title'] });

		const root = mount(Wrapper, {
			props: {
				title: 'title',
			},
			attrs: {
				any: 'any',
				class: 'class'
			}
		});

		expect(root.find('span').text()).toMatch(`title0`);
		expect(root.attributes()).toEqual({}); // 由于设置了inheritAttrs=false
		expect(root.find('span').attributes()).toEqual({ class: 'class', any: 'any' }); // 由于使用了attrs

		await root.trigger('click');
		expect(root.find('span').text()).toMatch(`title1`);

		await root.setProps({ any: 'any-' } as any);
		expect(root.find('span').text()).toMatch(`title2`);
		expect(root.attributes()).toEqual({});
		expect(root.find('span').attributes()).toEqual({ class: 'class', any: 'any-' });
	});
});
