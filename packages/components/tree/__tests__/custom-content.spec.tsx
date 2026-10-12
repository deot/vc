// @vitest-environment jsdom

import { Tree } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('emptyText', () => {
	it('字符串按文本渲染，支持渲染函数与 { type, value }', () => {
		const text = mount(() => (<Tree data={[]} emptyText={MARKUP} />));
		expect(text.find('.vc-tree__empty-text .inner').exists()).toBe(false);
		expect(text.find('.vc-tree__empty-text').text()).toBe(MARKUP);

		const html = mount(() => (<Tree data={[]} emptyText={{ type: 'html', value: MARKUP }} />));
		expect(html.find('span.vc-tree__empty-text .inner').exists()).toBe(true);

		const render = mount(() => (<Tree data={[]} emptyText={() => (<i class="render">empty</i>)} />));
		expect(render.find('.vc-tree__empty-block > .render').exists()).toBe(true);
	});

	it('empty 插槽优先于 emptyText', () => {
		const wrapper = mount(() => (<Tree data={[]} emptyText="prop" v-slots={{ empty: () => (<i class="slot">slot</i>) }} />));

		expect(wrapper.find('.vc-tree__empty-block > .slot').exists()).toBe(true);
		expect(wrapper.find('.vc-tree__empty-text').exists()).toBe(false);
	});

	it('有数据时不渲染空状态', () => {
		const wrapper = mount(() => (
			<Tree data={[{ value: 'a', label: 'A' }]} v-slots={{ empty: () => (<i class="slot">slot</i>) }} />
		));

		expect(wrapper.find('.vc-tree__empty-block').exists()).toBe(false);
	});
});
