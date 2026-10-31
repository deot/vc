// @vitest-environment jsdom

import { Customer, MRadio, Radio, RadioButton, RadioGroup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const MARKUP = '<b class="inner">text</b>';
// 标签文字所在的节点：label 的最后一个子元素
const last = (wrapper: any) => wrapper.element.lastElementChild as HTMLElement;

describe('label', () => {
	it('字符串按文本渲染，支持渲染函数与 { type, value }', () => {
		[Radio, MRadio].forEach((Component: any) => {
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

	it('数字 0 放在 span 内，没有内容时不创建 Customer', () => {
		const zero = mount(() => (<Radio value={0} />));
		expect(last(zero).tagName).toBe('SPAN');
		expect(last(zero).textContent).toBe('0');

		const none = mount(() => (<Radio />));
		expect(none.findComponent(Customer).exists()).toBe(false);

		const bool = mount(() => (<Radio value={true} />));
		expect(bool.findComponent(Customer).exists()).toBe(false);
	});

	it('has-sibling 与是否渲染了标签一致', () => {
		[Radio, MRadio].forEach((Component: any) => {
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

	it('RadioButton：各种内容都直接放在按钮的标签元素内，数字 0 正常显示', () => {
		const wrapper = mount(() => (
			<RadioGroup modelValue="a">
				<RadioButton value="a" label={MARKUP} />
				<RadioButton value="b" label={() => (<i class="render">label</i>)} />
				<RadioButton value="c" label={{ type: 'html', value: MARKUP }} />
				<RadioButton value="d" label={0} />
				<RadioButton value="e" v-slots={{ default: () => (<i class="slot">slot</i>) }} />
				<RadioButton value="f" />
			</RadioGroup>
		));

		const [text, render, html, zero, slot, value] = wrapper.findAll('.vc-radio__label').map(i => i.element.innerHTML);
		expect(text).toBe('&lt;b class="inner"&gt;text&lt;/b&gt;');
		expect(render).toBe('<i class="render">label</i>');
		expect(html).toBe(MARKUP);
		expect(zero).toBe('0');
		expect(slot).toBe('<i class="slot">slot</i>');
		// 没有 label 时显示 value
		expect(value).toBe('f');
	});
});
