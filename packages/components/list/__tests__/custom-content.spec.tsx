// @vitest-environment jsdom

import { MCustomer, MList, MListItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';

describe('MListItem label / extra', () => {
	it('字符串按文本渲染，支持渲染函数与 { type, value }', () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem label={MARKUP} extra={{ type: 'html', value: MARKUP }} />
				<MListItem label={() => (<i class="render-label">label</i>)} extra={() => (<i class="render-extra">extra</i>)} />
			</MList>
		));

		const [first, second] = wrapper.findAll('.vcm-list-item__wrapper');
		expect(first.find(':scope > div:first-child .inner').exists()).toBe(false);
		expect(first.find(':scope > div:first-child').text()).toBe(MARKUP);
		expect(first.find('.vcm-list-item__extra .inner').exists()).toBe(true);
		expect(second.find(':scope > div:first-child > .render-label').exists()).toBe(true);
		expect(second.find('.vcm-list-item__extra > .render-extra').exists()).toBe(true);
	});

	it('没有 extra 时保留空容器，但不为它创建 Customer', () => {
		const wrapper = mount(() => (<MList><MListItem label="label" /></MList>));
		expect(wrapper.find('.vcm-list-item__extra').element.outerHTML).toBe('<div class="vcm-list-item__extra"></div>');
		expect(wrapper.findAllComponents(MCustomer)).toHaveLength(1);

		const wrapper$ = mount(() => (<MList><MListItem label="label" extra="extra" /></MList>));
		expect(wrapper$.find('.vcm-list-item__extra').text()).toBe('extra');
		expect(wrapper$.findAllComponents(MCustomer)).toHaveLength(2);
	});

	it('插槽优先于属性', () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem label="prop" extra="prop" v-slots={{ label: () => 'slot-label', extra: () => 'slot-extra' }} />
			</MList>
		));

		expect(wrapper.find('.vcm-list-item__wrapper > div:first-child').text()).toBe('slot-label');
		expect(wrapper.find('.vcm-list-item__extra').text()).toBe('slot-extra');
	});
});
