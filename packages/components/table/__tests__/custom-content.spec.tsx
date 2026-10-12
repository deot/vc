// @vitest-environment jsdom

import { Table, TableColumn } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('emptyText', () => {
	const create = (emptyText: any, slots: Record<string, any> = {}) => mount(() => (
		<Table data={[]} emptyText={emptyText} v-slots={{ default: () => (<TableColumn prop="name" label="name" />), ...slots }} />
	));

	it('字符串按文本渲染', () => {
		const wrapper = create(MARKUP);

		expect(wrapper.find('.vc-table__empty-text .inner').exists()).toBe(false);
		expect(wrapper.find('.vc-table__empty-text').text()).toBe(MARKUP);
		wrapper.unmount();
	});

	it('渲染函数会被调用，不再显示成函数源码', () => {
		const wrapper = create(() => (<i class="render">empty</i>));

		expect(wrapper.find('.vc-table__empty-wrapper > .render').text()).toBe('empty');
		wrapper.unmount();
	});

	it('支持 { type, value }，empty 插槽优先', () => {
		const html = create({ type: 'html', value: MARKUP });
		expect(html.find('span.vc-table__empty-text .inner').exists()).toBe(true);
		html.unmount();

		const slot = create('prop', { empty: () => (<i class="slot">slot</i>) });
		expect(slot.find('.vc-table__empty-wrapper > .slot').exists()).toBe(true);
		expect(slot.find('.vc-table__empty-text').exists()).toBe(false);
		slot.unmount();
	});
});
