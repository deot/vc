// @vitest-environment jsdom

import { Divider } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import * as path from 'node:path';
import * as sass from 'sass';
import { MDivider } from '../index.m';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Divider).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Divider />));

		expect(wrapper.classes()).toEqual(['vc-divider', 'is-horizontal', 'is-center']);
		expect(wrapper.find('.vc-divider__text').exists()).toBe(false);
	});

	it('文字与位置：位置类名在根节点上，有文字时另有 is-with-text', () => {
		const wrapper = mount(() => (<Divider placement="left">文字</Divider>));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-horizontal', 'is-left', 'is-with-text']));
		expect(wrapper.find('.vc-divider__text').text()).toBe('文字');
	});

	it('vertical：不渲染文字，没有位置类名', () => {
		const wrapper = mount(() => (<Divider vertical placement="left">文字</Divider>));

		expect(wrapper.classes()).toEqual(['vc-divider', 'is-vertical']);
		expect(wrapper.find('.vc-divider__text').exists()).toBe(false);
	});

	it('dashed', () => {
		expect(mount(() => (<Divider dashed />)).classes()).toContain('is-dashed');
		expect(mount(() => (<Divider vertical dashed />)).classes()).toEqual(['vc-divider', 'is-vertical', 'is-dashed']);
	});

	it('样式：线由伪元素画出，尺寸为局部变量，文字不再有遮挡用的底色', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/divider/style.scss')).css;

		expect(css).toContain('height: var(--vc-divider-height, 1px)');
		expect(css).toContain('margin: var(--vc-divider-margin, 24px 0)');
		expect(css).toContain('border-top: var(--vc-divider-line-width, 1px) var(--vc-divider-line-style, solid)');
		expect(css).toContain('max-width: var(--vc-divider-side-width, 20px)');
		expect(css).not.toContain('background-color-lightest');
		// 虚线只改水平线的伪元素，竖线的 ::before 是排版用的零宽字符
		expect(css).toContain('.vc-divider.is-dashed.is-horizontal::before');
	});
});

describe('index.m.ts', () => {
	it('MDivider：与 Divider 结构相同，根节点另有标记类 vcm-divider', () => {
		const wrapper = mount(() => (<MDivider placement="right" dashed>文字</MDivider>));

		expect(wrapper.classes()).toEqual(['vc-divider', 'vcm-divider', 'is-horizontal', 'is-right', 'is-with-text', 'is-dashed']);
		expect(wrapper.find('.vc-divider__text').text()).toBe('文字');
	});

	it('移动端只覆盖局部变量（750 稿），高分屏为 0.5px 细线', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/divider/mobile/style.scss')).css;
		const rule = (selector: string) => {
			const start = css.indexOf(`${selector} {`);
			return start === -1 ? '' : css.slice(start, css.indexOf('}', start));
		};

		expect(rule('.vcm-divider')).toContain('--vc-divider-font-size: calc(var(--vc-rem) * 28)');
		expect(rule('.vcm-divider')).toContain('--vc-divider-gap: calc(var(--vc-rem) * 24)');
		expect(rule('.vcm-divider')).toContain('--vc-divider-side-width: calc(var(--vc-rem) * 56)');
		expect(rule('.vcm-divider')).toContain('--vc-divider-height: auto');
		expect(rule('.vcm-divider.is-horizontal')).toContain('padding: calc(var(--vc-rem) * 32)');
		expect(css).toContain('--vc-divider-line-width: 0.5px');
		expect(css).not.toContain('.vc-divider');
	});
});
