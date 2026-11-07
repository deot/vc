// @vitest-environment jsdom

import { Tag, Icon } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import * as path from 'node:path';
import * as sass from 'sass';
import { vi } from 'vitest';
import { MTag } from '../index.m';

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

	it('propagation: 非 checkable 时点击冒泡', async () => {
		const handleClick = vi.fn();
		const wrapper = mount(() => (
			<div onClick={handleClick}><Tag /></div>
		));

		await wrapper.find('.vc-tag').trigger('click');

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('propagation: checkable 时点击不冒泡', async () => {
		const handleClick = vi.fn();
		const wrapper = mount(() => (
			<div onClick={handleClick}><Tag checkable /></div>
		));

		await wrapper.find('.vc-tag').trigger('click');

		expect(handleClick).not.toHaveBeenCalled();
	});

	it('propagation: 点击关闭图标不冒泡, 也不切换选中状态', async () => {
		const handleClick = vi.fn();
		const handleClose = vi.fn();
		const handleChange = vi.fn();
		const wrapper = mount(() => (
			<div onClick={handleClick}>
				<Tag closable checkable onClose={handleClose} onChange={handleChange} />
			</div>
		));

		await wrapper.find('.vc-tag__close').trigger('click');

		expect(handleClose).toHaveBeenCalledTimes(1);
		expect(handleChange).not.toHaveBeenCalled();
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('MTag: 与 Tag 结构相同，根节点另有标记类 vcm-tag', () => {
		const wrapper = mount(() => (<MTag type="dot" color="primary">标签</MTag>));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-tag', 'vcm-tag', 'is-dot', 'is-primary']));
		expect(wrapper.find('.vc-tag__wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-tag__dot').exists()).toBe(true);
		expect(wrapper.text()).toBe('标签');
	});

	it('MTag: 关闭图标与 Tag 相同', () => {
		const wrapper = mount(() => (<MTag closable />));
		const close = wrapper.find('.vc-tag__close');

		expect(close.exists()).toBe(true);
		expect(wrapper.findComponent(Icon).exists()).toBe(true);
	});

	it('MTag: close / change 事件与 Tag 一致', async () => {
		const handleClose = vi.fn();
		const handleChange = vi.fn();
		const wrapper = mount(() => (
			<MTag closable checkable value="tag1" onClose={handleClose} onChange={handleChange} />
		));

		await wrapper.find('.vc-tag__close').trigger('click');
		expect(handleClose).toHaveBeenCalledTimes(1);
		expect(handleClose.mock.calls[0][1]).toBe('tag1');
		expect(handleChange).not.toHaveBeenCalled();

		await wrapper.trigger('click');
		expect(handleChange).toHaveBeenCalledTimes(1);
		expect(handleChange.mock.calls[0]).toEqual([false, 'tag1']);
		expect(wrapper.classes()).toContain('is-unchecked');
	});

	it('移动端尺寸为 750 稿，三种 type 等高（375 宽下 20px）', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/tag/mobile/style.scss')).css;
		const rule = (selector: string) => {
			// 只取顶层规则（行首），跳过主题媒体查询里的同名选择器
			const start = css.indexOf(`\n${selector} {`);
			return start === -1 ? '' : css.slice(start, css.indexOf('}', start));
		};

		expect(rule('.vcm-tag')).toContain('--vc-tag-height: calc(var(--vc-rem) * 40)');
		expect(rule('.vcm-tag')).toContain('--vc-tag-font-size: calc(var(--vc-rem) * 24)');
		expect(rule('.vcm-tag')).toContain('--vc-tag-wrapper-padding: 0 calc(var(--vc-rem) * 8)');
		expect(rule('.vcm-tag')).toContain('--vc-tag-border-height: calc(var(--vc-rem) * 40)');
		expect(rule('.vcm-tag')).toContain('--vc-tag-dot-height: calc(var(--vc-rem) * 40)');

		const desktop = sass.compile(path.resolve(process.cwd(), 'packages/components/tag/style.scss')).css;
		expect(desktop).toContain('height: var(--vc-tag-height, 22px)');
	});
});
