// @vitest-environment jsdom

import { Tag } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tag).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.classes()).toContain('vc-tag');
	});

	it('slot default: 渲染文本内容', () => {
		const wrapper = mount(() => (<Tag>标签</Tag>));

		expect(wrapper.text()).toBe('标签');
	});

	it('color: 默认颜色类名', () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.classes()).toContain('is-default');
	});

	it('color: 自定义颜色类名', () => {
		const wrapper = mount(() => (<Tag color="primary" />));

		expect(wrapper.classes()).toContain('is-primary');
	});

	it('type: 默认类型类名', () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.classes()).toContain('is-default');
	});

	it('type: border 类型类名', () => {
		const wrapper = mount(() => (<Tag type="border" />));

		expect(wrapper.classes()).toContain('is-border');
	});

	it('type: dot 类型渲染圆点', () => {
		const wrapper = mount(() => (<Tag type="dot" />));

		expect(wrapper.classes()).toContain('is-dot');
		expect(wrapper.find('.vc-tag__dot').exists()).toBe(true);
	});

	it('type: 非 dot 类型不渲染圆点', () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.find('.vc-tag__dot').exists()).toBe(false);
	});

	it('closable: 默认不渲染关闭图标', () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.find('.vc-tag__close').exists()).toBe(false);
	});

	it('closable: 为 true 时渲染关闭图标', () => {
		const wrapper = mount(() => (<Tag closable />));

		expect(wrapper.find('.vc-tag__close').exists()).toBe(true);
	});

	it('close: 点击关闭图标触发 close 事件', async () => {
		const handleClose = vi.fn();
		const wrapper = mount(() => (
			<Tag closable value="tag1" onClose={handleClose} />
		));

		await wrapper.find('.vc-tag__close').trigger('click');

		expect(handleClose).toHaveBeenCalledTimes(1);
		expect(handleClose.mock.calls[0][1]).toBe('tag1');
	});

	it('close: 未设置 value 时携带 undefined', async () => {
		const handleClose = vi.fn();
		const wrapper = mount(() => (<Tag closable onClose={handleClose} />));

		await wrapper.find('.vc-tag__close').trigger('click');

		expect(handleClose).toHaveBeenCalledTimes(1);
		expect(handleClose.mock.calls[0][1]).toBe(undefined);
	});

	it('checkable: 为 false 时点击不触发 change 事件', async () => {
		const handleChange = vi.fn();
		const wrapper = mount(() => (<Tag onChange={handleChange} />));

		await wrapper.trigger('click');

		expect(handleChange).not.toHaveBeenCalled();
	});

	it('checkable: 为 true 时点击触发 change 事件', async () => {
		const handleChange = vi.fn();
		const wrapper = mount(() => (
			<Tag checkable value="tag1" onChange={handleChange} />
		));

		await wrapper.trigger('click');

		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange.mock.calls[0][0]).toBe(false);
		expect(handleChange.mock.calls[0][1]).toBe('tag1');
	});

	it('checkable: 点击切换选中状态类名', async () => {
		const wrapper = mount(() => (<Tag checkable />));

		expect(wrapper.classes()).not.toContain('is-unchecked');

		await wrapper.trigger('click');
		expect(wrapper.classes()).toContain('is-unchecked');

		await wrapper.trigger('click');
		expect(wrapper.classes()).not.toContain('is-unchecked');
	});

	it('checked: 为 false 时初始为未选中状态', () => {
		const wrapper = mount(() => (<Tag checked={false} />));

		expect(wrapper.classes()).toContain('is-unchecked');
	});

	it('checked: 为 true 时初始为选中状态', () => {
		const wrapper = mount(() => (<Tag checked />));

		expect(wrapper.classes()).not.toContain('is-unchecked');
	});
});
