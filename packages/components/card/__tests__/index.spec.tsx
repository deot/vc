// @vitest-environment jsdom

import { Card } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import * as path from 'node:path';
import * as sass from 'sass';
import { MCard } from '../index.m';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Card).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.classes()).toContain('vc-card');
	});

	it('border: 默认添加边框类名', () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.classes()).toContain('is-border');
	});

	it('border: 为 false 时不添加边框类名', () => {
		const wrapper = mount(() => (<Card border={false} />));

		expect(wrapper.classes()).not.toContain('is-border');
	});

	it('shadow: 默认不添加阴影类名', () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.classes()).not.toContain('is-shadow');
	});

	it('shadow: 为 true 时添加阴影类名', () => {
		const wrapper = mount(() => (<Card shadow />));

		expect(wrapper.classes()).toContain('is-shadow');
	});

	it('padding: 默认内边距为 16px', () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.find('.vc-card__body').attributes('style')).toContain('padding: 16px');
	});

	it('padding: 自定义内边距', () => {
		const wrapper = mount(() => (<Card padding={24} />));

		expect(wrapper.find('.vc-card__body').attributes('style')).toContain('padding: 24px');
	});

	it('title: 渲染标题文本', () => {
		const wrapper = mount(() => (<Card title="标题" />));

		expect(wrapper.find('.vc-card__header').exists()).toBe(true);
		expect(wrapper.find('.vc-card__header').text()).toBe('标题');
	});

	it('title: 未设置标题时不渲染头部', () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.find('.vc-card__header').exists()).toBe(false);
	});

	it('icon: 有标题时渲染图标', () => {
		const wrapper = mount(() => (<Card title="标题" icon="search" />));

		expect(wrapper.find('.vc-card__header').exists()).toBe(true);
		expect(wrapper.find('.vc-icon').exists()).toBe(true);
	});

	it('icon: 无标题时不渲染头部与图标', () => {
		const wrapper = mount(() => (<Card icon="search" />));

		expect(wrapper.find('.vc-card__header').exists()).toBe(false);
		expect(wrapper.find('.vc-icon').exists()).toBe(false);
	});

	it('slot title: 优先使用标题插槽', () => {
		const wrapper = mount(() => (
			<Card
				title="标题"
				v-slots={{ title: () => (<div class="custom-title">自定义标题</div>) }}
			/>
		));

		expect(wrapper.find('.vc-card__header').exists()).toBe(true);
		expect(wrapper.find('.custom-title').text()).toBe('自定义标题');
	});

	it('slot title: 仅有插槽也渲染头部', () => {
		const wrapper = mount(() => (
			<Card v-slots={{ title: () => (<div class="custom-title">自定义标题</div>) }} />
		));

		expect(wrapper.find('.vc-card__header').exists()).toBe(true);
		expect(wrapper.find('.custom-title').text()).toBe('自定义标题');
	});

	it('slot extra: 渲染额外内容', () => {
		const wrapper = mount(() => (
			<Card v-slots={{ extra: () => (<div class="custom-extra">额外内容</div>) }} />
		));

		expect(wrapper.find('.vc-card__extra').exists()).toBe(true);
		expect(wrapper.find('.custom-extra').text()).toBe('额外内容');
	});

	it('slot extra: 有标题时位于标题栏内、标题之后，无标题时位于卡片根节点下', () => {
		const withTitle = mount(() => (
			<Card title="标题" v-slots={{ extra: () => '更多' }} />
		));
		const header = withTitle.find('.vc-card__header');

		expect(header.element.children[0].classList.contains('vc-card__title')).toBe(true);
		expect(header.element.children[1].classList.contains('vc-card__extra')).toBe(true);

		const withoutTitle = mount(() => (
			<Card v-slots={{ extra: () => '更多' }} />
		));

		expect(withoutTitle.find('.vc-card > .vc-card__extra').exists()).toBe(true);
	});

	it('icon: 图标带 __icon 类名，用于与标题文字的间距', () => {
		const wrapper = mount(() => (<Card title="标题" icon="search" />));

		expect(wrapper.find('.vc-icon.vc-card__icon').exists()).toBe(true);
	});

	it('slot extra: 未设置时不渲染', () => {
		const wrapper = mount(() => (<Card />));

		expect(wrapper.find('.vc-card__extra').exists()).toBe(false);
	});

	it('slot default: 渲染主体内容', () => {
		const wrapper = mount(() => (
			<Card v-slots={{ default: () => (<div class="custom-body">主体内容</div>) }} />
		));

		expect(wrapper.find('.vc-card__body').exists()).toBe(true);
		expect(wrapper.find('.custom-body').text()).toBe('主体内容');
	});

	it('MCard: 与 Card 结构相同，根节点另有标记类 vcm-card', () => {
		const wrapper = mount(() => (
			<MCard title="标题" icon="search" v-slots={{ extra: () => '更多' }} />
		));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-card', 'vcm-card', 'is-border']));
		expect(wrapper.find('.vc-card__header').exists()).toBe(true);
		expect(wrapper.find('.vc-card__extra').text()).toBe('更多');
		expect(wrapper.find('.vc-icon.vc-card__icon').exists()).toBe(true);
	});

	it('MCard: padding 为 750 稿长度，默认 32', () => {
		const wrapper = mount(() => (<MCard />));
		const custom = mount(() => (<MCard padding={24} />));

		expect(wrapper.find('.vc-card__body').attributes('style')).toContain('padding: calc(var(--vc-rem) * 32)');
		expect(custom.find('.vc-card__body').attributes('style')).toContain('padding: calc(var(--vc-rem) * 24)');
		expect(mount(() => (<MCard padding="1em" />)).find('.vc-card__body').attributes('style')).toContain('padding: 1em');
	});

	it('移动端尺寸为 750 稿（375 宽下标题栏高 46px），无悬停阴影', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/card/mobile/style.scss')).css;
		// 同一选择器可能有多段规则（如 1px 边框单独一段），合并后再断言
		const rule = (selector: string) => css
			.split(`\n${selector} {`)
			.slice(1)
			.map(part => part.slice(0, part.indexOf('}')))
			.join('');

		expect(rule('.vcm-card')).toContain('--vc-card-font-size: calc(var(--vc-rem) * 28)');
		expect(rule('.vcm-card')).toContain('--vc-card-radius: calc(var(--vc-rem) * 16)');
		expect(rule('.vcm-card')).toContain('--vc-card-header-padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32)');
		expect(rule('.vcm-card')).toContain('--vc-card-title-font-size: calc(var(--vc-rem) * 32)');
		expect(rule('.vcm-card')).toContain('--vc-card-title-line-height: calc(var(--vc-rem) * 44)');
		expect(rule('.vcm-card')).toContain('--vc-card-transition: none');
		expect(rule('.vcm-card')).toContain('--vc-card-box-shadow-floating: none');
		expect(rule('.vcm-card')).toContain('line-height: 1.4');
		expect(css).not.toContain('.vc-card');

		const desktop = sass.compile(path.resolve(process.cwd(), 'packages/components/card/style.scss')).css;
		expect(desktop).toContain('transition: var(--vc-card-transition, all 0.2s ease-in-out)');
		expect(desktop).toContain('line-height: var(--vc-card-title-line-height, 20px)');
	});
});
