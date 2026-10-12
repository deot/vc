// @vitest-environment jsdom

import { Checkbox, Customer, MCheckbox } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';
// 标签文字所在的节点：label 的最后一个子元素
const last = (wrapper: any) => wrapper.element.lastElementChild as HTMLElement;

describe('label', () => {
	it('字符串按文本渲染，支持渲染函数与 { type, value }', () => {
		[Checkbox, MCheckbox].forEach((Component: any) => {
			const text = mount(() => (<Component value="a" label={MARKUP} />));
			expect(text.find('.inner').exists()).toBe(false);
			expect(last(text).tagName).toBe('SPAN');
			expect(last(text).textContent).toBe(MARKUP);

			const html = mount(() => (<Component value="a" label={{ type: 'html', value: MARKUP }} />));
			expect(last(html).tagName).toBe('SPAN');
			expect(last(html).querySelector('.inner')).not.toBe(null);

			const render = mount(() => (<Component value="a" label={() => (<i class="render">label</i>)} />));
			expect(last(render).className).toBe('render');
		});
	});

	it('默认插槽优先；没有内容时不创建 Customer', () => {
		const slot = mount(() => (<Checkbox value="a" label="prop">slot</Checkbox>));
		expect(slot.text()).toBe('slot');

		const none = mount(() => (<Checkbox />));
		expect(none.findComponent(Customer).exists()).toBe(false);

		const zero = mount(() => (<Checkbox value={0} />));
		expect(last(zero).tagName).toBe('SPAN');
		expect(last(zero).textContent).toBe('0');
	});

	it('has-sibling 与是否渲染了标签一致', () => {
		[Checkbox, MCheckbox].forEach((Component: any) => {
			const hasSibling = (props: any) => mount(() => (<Component {...props} />)).find('.has-sibling').exists();

			expect(hasSibling({ value: 0 })).toBe(true);
			expect(hasSibling({ label: { type: 'html', value: MARKUP } })).toBe(true);
			expect(hasSibling({ label: () => 'label' })).toBe(true);
			expect(hasSibling({})).toBe(false);
			expect(hasSibling({ value: true })).toBe(false);
			expect(hasSibling({ label: '' })).toBe(false);
			expect(hasSibling({ label: { type: 'html', value: '' } })).toBe(false);
		});
	});
});
