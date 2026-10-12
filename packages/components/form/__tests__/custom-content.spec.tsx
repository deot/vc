// @vitest-environment jsdom

import { Form, FormItem, MForm, MFormItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('FormItem label', () => {
	it('字符串按文本渲染，支持渲染函数与 { type, value }', () => {
		const wrapper = mount(() => (
			<Form model={{}}>
				<FormItem label={MARKUP} />
				<FormItem label={{ type: 'html', value: MARKUP }} />
				<FormItem label={() => (<i class="render">label</i>)} />
			</Form>
		));

		const [text, html, render] = wrapper.findAll('.vc-form-item__label label');
		expect(text.find('.inner').exists()).toBe(false);
		expect(text.text()).toBe(MARKUP);
		expect(html.find('.inner').exists()).toBe(true);
		expect(render.find('.render').exists()).toBe(true);
	});

	it('label 插槽优先于属性', () => {
		const wrapper = mount(() => (
			<Form model={{}}>
				<FormItem label="prop" v-slots={{ label: () => 'slot' }} />
			</Form>
		));

		expect(wrapper.find('.vc-form-item__label label').text()).toBe('slot');
	});

	it('移动端：属性落在 label 元素上，插槽优先', () => {
		const wrapper = mount(() => (
			<MForm model={{}}>
				<MFormItem label={() => (<i class="render">label</i>)} labelFor="field" />
				<MFormItem label="prop" v-slots={{ label: () => 'slot' }} />
			</MForm>
		));

		const [render, slot] = wrapper.findAll('label.vcm-form-item__label');
		expect(render.attributes('for')).toBe('field');
		expect(render.find('.render').exists()).toBe(true);
		expect(slot.text()).toBe('slot');
	});
});
