// @vitest-environment jsdom

import { Card } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

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
});
