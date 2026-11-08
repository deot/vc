// @vitest-environment jsdom

import { Button, ButtonGroup, Spin, Icon } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import * as path from 'node:path';
import * as sass from 'sass';
import { MButton, MButtonGroup } from '../index.m';
import { Utils } from '@deot/dev-test';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Button).toBe('object');
	});

	it('tag', async () => {
		const link = 'any';
		const wrapper = mount(() => (
			<Button
				tag="a"
				// @ts-ignore
				href={link}
			/>
		));

		expect(wrapper.element.nodeName).toBe('A');
		expect(wrapper.attributes('href')).toBe(link);
	});

	it('type', async () => {
		const wrapper = mount(() => <Button type="primary" />);

		expect(wrapper.classes()).toContain('is-primary');
	});

	it('icon', async () => {
		const wrapper = mount(() => <Button icon="search" />);

		expect(wrapper.classes()).toContain('is-with-icon');
		expect(wrapper.find('.vc-button__icon').exists()).toBeTruthy();
		expect(wrapper.findComponent(Icon).exists()).toBeTruthy();
	});

	it('size, disabled, circle, round, long', async () => {
		const wrapper = mount(() => <Button size="large" disabled circle round long />);

		expect(wrapper.classes()).toContain('is-large');
		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.classes()).toContain('is-circle');
		expect(wrapper.classes()).toContain('is-round');
		expect(wrapper.classes()).toContain('is-long');
	});

	it('solid, dashed', async () => {
		const wrapper = mount(() => <Button solid dashed />);

		expect(wrapper.classes()).toContain('is-solid');
		expect(wrapper.classes()).toContain('is-dashed');
	});

	it('alone', async () => {
		const wrapper = mount(() => <Button />);

		expect(wrapper.classes()).toContain('is-alone');
		expect(wrapper.find('span').exists()).toBeFalsy();
	});

	it('default slot', async () => {
		const wrapper = mount(() => <Button>text</Button>);

		expect(wrapper.classes()).not.toContain('is-alone');
		expect(wrapper.find('span').exists()).toBeTruthy();
		expect(wrapper.find('span').text()).toBe('text');
	});

	it('hover', async () => {
		const wrapper = mount(() => <Button />);

		expect(wrapper.classes()).not.toContain('is-hover');

		await wrapper.trigger('mouseenter');
		expect(wrapper.classes()).toContain('is-hover');

		await wrapper.trigger('mouseleave');
		expect(wrapper.classes()).not.toContain('is-hover');
	});

	it('icon slot', async () => {
		const wrapper = mount(() => (
			<Button
				v-slots={{
					icon: ({ hover }: { hover: boolean }) => <i class="custom-icon">{hover ? 'on' : 'off'}</i>
				}}
			/>
		));

		expect(wrapper.find('.custom-icon').exists()).toBeTruthy();
		expect(wrapper.find('.vc-button__icon').exists()).toBeTruthy();
		expect(wrapper.classes()).toContain('is-with-icon');
		expect(wrapper.find('.custom-icon').text()).toBe('off');

		await wrapper.trigger('mouseenter');
		expect(wrapper.find('.custom-icon').text()).toBe('on');
	});

	it('htmlType', async () => {
		const wrapper = mount(() => <Button htmlType="submit" />);

		expect(wrapper.attributes('type')).toContain('submit');
	});

	it('click, debounce', async () => {
		let count = 0;
		const handler = () => {
			count++;
		};

		const wrapper = mount(() => <Button wait={300} onClick={handler} />);

		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');
		await wrapper.trigger('click');

		expect(count).toBe(1);
	});
	it('click, loading', async () => {
		expect.assertions(5);
		const handler = async () => {
			await Utils.sleep(10);
			const spin = wrapper.findComponent(Spin);

			expect(spin.exists()).toBeTruthy();
			expect(spin.props('foreground')).toBe('var(--vc-button-color-light-deepest, var(--vc-color-light-deepest))');
			expect(spin.props('background')).toBe('var(--vc-button-color-primary, var(--vc-color-primary))');
		};

		const wrapper = mount(() => <Button onClick={handler} />);

		await wrapper.trigger('click');
		await Utils.sleep(10);
		expect(wrapper.emitted()).toBeDefined();
		expect(wrapper.findComponent(Spin).exists()).toBeFalsy();
	});

	it('click, loading, is-loading 与 icon 并存，loading 在前', async () => {
		expect.assertions(5);
		const handler = async () => {
			await Utils.sleep(10);

			expect(wrapper.classes()).toContain('is-loading');
			expect(wrapper.findComponent(Icon).exists()).toBeTruthy();
			expect(wrapper.findComponent(Spin).exists()).toBeTruthy();
			expect(wrapper.element.firstElementChild!.classList.contains('vc-spin')).toBeTruthy();
		};

		const wrapper = mount(() => <Button icon="search" onClick={handler}>搜索</Button>);

		await wrapper.trigger('click');
		await Utils.sleep(30);
		expect(wrapper.classes()).not.toContain('is-loading');
	});

	it('click, loading, 只有图标的圆形按钮只显示 loading', async () => {
		expect.assertions(3);
		const handler = async () => {
			await Utils.sleep(10);

			expect(wrapper.findComponent(Spin).exists()).toBeTruthy();
			expect(wrapper.findComponent(Icon).exists()).toBeFalsy();
		};

		const wrapper = mount(() => <Button icon="search" round onClick={handler} />);

		await wrapper.trigger('click');
		await Utils.sleep(30);
		expect(wrapper.findComponent(Icon).exists()).toBeTruthy();
	});

	it('click, loading, foreground', async () => {
		expect.assertions(1);
		const handler = async () => {
			await Utils.sleep(10);
			expect(wrapper.findComponent(Spin).props('foreground')).toBe('currentColor');
		};

		const wrapper = mount(() => <Button type="primary" onClick={handler} />);

		await wrapper.trigger('click');
		await Utils.sleep(10);
	});

	it('group', async () => {
		const wrapper = mount(() => <ButtonGroup><Button /></ButtonGroup>);

		expect(wrapper.classes()).toContain('vc-button-group');
	});

	it('group, styleless', async () => {
		const wrapper = mount(() => <ButtonGroup styleless size="small"><Button /></ButtonGroup>);

		expect(wrapper.classes()).not.toContain('vc-button-group');
		expect(wrapper.findComponent(Button).classes()).toContain('is-small');
	});

	it.each(['small', 'medium', 'large'])('group inherits %s size', (size) => {
		const wrapper = mount(() => <ButtonGroup size={size}><Button size="large" /></ButtonGroup>);

		expect(wrapper.findComponent(Button).classes()).toContain(`is-${size}`);
	});

	it('group size updates reactively', async () => {
		const wrapper = mount(ButtonGroup, {
			props: { size: 'large' },
			slots: { default: () => <Button /> }
		});

		expect(wrapper.findComponent(Button).classes()).toContain('is-large');
		await wrapper.setProps({ size: 'small' });
		expect(wrapper.findComponent(Button).classes()).toContain('is-small');
		expect(wrapper.findComponent(Button).classes()).not.toContain('is-large');
	});

	it('group, vertical, circle, size', async () => {
		const wrapper = mount(() => (
			<ButtonGroup vertical circle size="large">
				<Button />
			</ButtonGroup>
		));

		expect(wrapper.classes()).toContain('is-vertical');
		expect(wrapper.classes()).toContain('is-circle');
		expect(wrapper.classes()).toContain('is-large');
		expect(wrapper.findComponent(Button).classes()).toContain('is-large');
	});

	it('group, circle inject', async () => {
		const wrapper = mount(() => (
			<ButtonGroup circle>
				<Button />
			</ButtonGroup>
		));

		expect(wrapper.findComponent(Button).classes()).toContain('is-circle');
	});
});

describe('index.m.ts', () => {
	it('MButton / MButtonGroup 与桌面端结构相同，根节点另有 vcm- 标记类，size 支持 mini', () => {
		const wrapper = mount(() => (
			<MButtonGroup size="mini">
				<MButton>A</MButton>
			</MButtonGroup>
		));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-button-group', 'vcm-button-group', 'is-mini']));
		const button = wrapper.findComponent(MButton);
		expect(button.classes()).toEqual(expect.arrayContaining(['vc-button', 'vcm-button', 'is-mini']));
	});

	it('MButton 的加载图标为 750 稿长度，图标跟随 --vc-button-<档>-icon-size', async () => {
		expect.assertions(4);
		const handler = async () => {
			await Utils.sleep(10);
			const spin = wrapper.findComponent(Spin);
			expect(spin.exists()).toBeTruthy();
			// 750 稿：375 宽下 14px
			expect(spin.props('size')).toBe('calc(var(--vc-rem) * 28)');
		};
		const wrapper = mount(() => <MButton icon="search" onClick={handler}>A</MButton>);

		expect(wrapper.find('.vc-button__icon').findComponent(Icon).exists()).toBeTruthy();
		await wrapper.trigger('click');
		await Utils.sleep(10);
		expect(wrapper.findComponent(Spin).exists()).toBeFalsy();
	});

	it('Button 的 mini 尺寸', () => {
		const wrapper = mount(() => <Button size="mini" />);

		expect(wrapper.classes()).toContain('is-mini');
	});

	it('移动端尺寸为 750 稿（375 宽下 28 / 32 / 36 / 44），只覆盖局部变量与高度', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/button/mobile/style.scss')).css;
		const rule = (selector: string) => {
			const start = css.indexOf(`${selector} {`);
			return start === -1 ? '' : css.slice(start, css.indexOf('}', start));
		};

		expect(rule('.vcm-button')).toContain('height: calc(var(--vc-rem) * 72)');
		expect(rule('.vcm-button')).toContain('box-sizing: border-box');
		expect(rule('.vcm-button.is-large')).toContain('height: calc(var(--vc-rem) * 88)');
		expect(rule('.vcm-button.is-small')).toContain('height: calc(var(--vc-rem) * 64)');
		expect(rule('.vcm-button.is-mini')).toContain('height: calc(var(--vc-rem) * 56)');
		expect(rule('.vcm-button, .vcm-button-group')).toContain('--vc-button-medium-padding: 0 calc(var(--vc-rem) * 32)');
		expect(rule('.vcm-button, .vcm-button-group')).toContain('--vc-button-mini-line-height: 1.2');
		expect(css).not.toContain('.vc-button');
	});

	it('桌面端尺寸写成局部变量，默认值为 px', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/button/style.scss')).css;

		expect(css).toContain('padding: var(--vc-button-medium-padding, 5px 16px)');
		expect(css).toContain('line-height: var(--vc-button-mini-line-height, 18px)');
	});
});
