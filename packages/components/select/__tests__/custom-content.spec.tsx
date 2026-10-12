// @vitest-environment jsdom

import { Select } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('label', () => {
	it('前缀标签按文本渲染，支持渲染函数与 { type, value }', () => {
		const text = mount(() => (<Select label={MARKUP} data={[]} />));
		expect(text.find('.vc-select__label .inner').exists()).toBe(false);
		expect(text.find('.vc-select__label').text()).toBe(MARKUP);

		const html = mount(() => (<Select label={{ type: 'html', value: MARKUP }} data={[]} />));
		expect(html.find('span.vc-select__label .inner').exists()).toBe(true);

		const render = mount(() => (<Select label={() => (<i class="render">label</i>)} data={[]} />));
		expect(render.find('span.vc-select__label > .render').exists()).toBe(true);
	});

	it('prepend 插槽仍然替换整个前缀', () => {
		const wrapper = mount(() => (<Select label="label" data={[]} v-slots={{ prepend: () => (<i class="slot">slot</i>) }} />));

		expect(wrapper.find('.slot').exists()).toBe(true);
		expect(wrapper.find('.vc-select__label').exists()).toBe(false);
	});
});
