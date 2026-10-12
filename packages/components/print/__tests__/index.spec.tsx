// @vitest-environment jsdom

import { Print, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	afterEach(() => {
		VcInstance.configure({ sanitize: void 0 });
	});

	it('basic', () => {
		expect(typeof Print).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Print />));

		expect(wrapper.classes()).toContain('vc-print');
		expect(wrapper.html()).toBe('<div class="vc-print"></div>');
	});

	it('value 按 HTML 渲染', () => {
		const wrapper = mount(() => (<Print value="<b class='inner'>text</b>" />));

		expect(wrapper.html()).toBe('<div class="vc-print"><b class="inner">text</b></div>');
	});

	it('配置了 sanitize 时 value 先清洗再写入', () => {
		VcInstance.configure({ sanitize: ({ value }) => value.replace(/<img[^>]*>/g, '') });
		const wrapper = mount(() => (<Print value={'<b class="inner">text</b><img src="x" onerror="alert(1)">'} />));

		expect(wrapper.html()).toBe('<div class="vc-print"><b class="inner">text</b></div>');
	});

	it('默认插槽优先于 value', () => {
		const wrapper = mount(() => (<Print value="<b>value</b>">slot</Print>));

		expect(wrapper.html()).toBe('<div class="vc-print">slot</div>');
	});
});
