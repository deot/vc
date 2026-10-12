// @vitest-environment jsdom

import { Card } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('title', () => {
	it('字符串按文本渲染', () => {
		const wrapper = mount(() => (<Card title={MARKUP} icon="close" />));

		expect(wrapper.find('.vc-card__header .inner').exists()).toBe(false);
		expect(wrapper.find('.vc-card__header span').text()).toBe(MARKUP);
		expect(wrapper.find('.vc-card__header .vc-icon').exists()).toBe(true);
	});

	it('支持渲染函数与 { type, value }', () => {
		const html = mount(() => (<Card title={{ type: 'html', value: MARKUP }} />));
		expect(html.find('.vc-card__header span .inner').exists()).toBe(true);

		const render = mount(() => (<Card title={() => (<i class="render">title</i>)} icon="close" />));
		expect(render.find('.vc-card__header p > .render').exists()).toBe(true);
		expect(render.find('.vc-card__header .vc-icon').exists()).toBe(true);
	});

	it('title 插槽仍然替换整个标题', () => {
		const wrapper = mount(() => (<Card title="title" v-slots={{ title: () => (<i class="slot">slot</i>) }} />));

		expect(wrapper.find('.vc-card__header > .slot').exists()).toBe(true);
		expect(wrapper.find('.vc-card__header p').exists()).toBe(false);
	});
});
