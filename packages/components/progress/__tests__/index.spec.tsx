// @vitest-environment jsdom

import { Progress, MProgress } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const percentOf = (wrapper: any) => wrapper.element.style.getPropertyValue('--vc-progress-percent');

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Progress).toBe('object');
		expect(typeof MProgress).toBe('object');
	});

	it('create: 线形与 progressbar 属性', () => {
		const wrapper = mount(() => (<Progress percent={40} />));

		expect(wrapper.classes()).toEqual(['vc-progress', 'is-default']);
		expect(wrapper.attributes('role')).toBe('progressbar');
		expect(wrapper.attributes('aria-valuenow')).toBe('40');
		expect(wrapper.attributes('aria-valuemin')).toBe('0');
		expect(wrapper.attributes('aria-valuemax')).toBe('100');
		expect(wrapper.attributes('aria-disabled')).toBeUndefined();
		expect(wrapper.find('.vc-progress-line__box').attributes('style')).toContain('height: 6px');
		expect(wrapper.find('.vc-progress-line__percent').text()).toBe('40%');
	});

	it('percent: 限制在 0–100，NaN 为 0，100 视为 success', async () => {
		const wrapper = mount(Progress, { props: { percent: -10 } });
		expect(percentOf(wrapper)).toBe('0');

		await wrapper.setProps({ percent: 'abc' });
		expect(percentOf(wrapper)).toBe('0');

		await wrapper.setProps({ percent: '120' });
		expect(percentOf(wrapper)).toBe('100');
		expect(wrapper.classes()).toContain('is-success');
		expect(wrapper.find('.vc-progress-line__icon').exists()).toBe(true);
	});

	it('color / trackColor: 不传时由样式取主题色，传入时以内联局部变量覆盖', async () => {
		const wrapper = mount(Progress, { props: { percent: 30, status: 'error' } });
		const style = () => wrapper.element.style;

		expect(style().getPropertyValue('--vc-progress-bar-color')).toBe('');
		expect(style().getPropertyValue('--vc-progress-track-color')).toBe('');

		await wrapper.setProps({ color: { default: '#111111' }, trackColor: '#123456' });
		// 对象缺少当前状态（error）时回退主题色
		expect(style().getPropertyValue('--vc-progress-bar-color')).toBe('');
		expect(style().getPropertyValue('--vc-progress-track-color')).toBe('#123456');

		await wrapper.setProps({ color: '#222222' });
		expect(style().getPropertyValue('--vc-progress-bar-color')).toBe('#222222');

		await wrapper.setProps({ disabled: true });
		expect(style().getPropertyValue('--vc-progress-bar-color')).toBe('');
	});

	it('disabled: is-disabled + aria-disabled，停止 animated', async () => {
		const wrapper = mount(Progress, { props: { percent: 30, animated: true } });
		expect(wrapper.find('.vc-progress-line__inner').classes()).toContain('is-active');

		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.attributes('aria-disabled')).toBe('true');
		expect(wrapper.find('.vc-progress-line__inner').classes()).not.toContain('is-active');
	});

	it('textInside: 文字在进度条内，默认线高 16，不显示状态图标', () => {
		const wrapper = mount(Progress, { props: { percent: 100, textInside: true } });

		expect(wrapper.find('.vc-progress-line').classes()).toContain('is-inside');
		expect(wrapper.find('.vc-progress-line__box').attributes('style')).toContain('height: 16px');
		expect(wrapper.find('.vc-progress-line__percent').exists()).toBe(false);
		expect(wrapper.find('.vc-progress-line__icon').exists()).toBe(false);
		expect(wrapper.find('.vc-progress-line__inner').text()).toBe('100%');
	});

	it('default 插槽: 两种形态都传 { percent, status }，不受 showText 控制', () => {
		const slot = vi.fn(({ percent, status }) => `${percent}-${status}`);
		const line = mount(Progress, { props: { percent: 100, showText: false }, slots: { default: slot } });
		expect(line.find('.vc-progress-line__percent').text()).toBe('100-success');
		expect(line.find('.vc-progress-line__icon').exists()).toBe(false);

		const circle = mount(Progress, { props: { type: 'circle', percent: 20 }, slots: { default: slot } });
		expect(circle.find('.vc-progress-circle__inner').text()).toBe('20-default');
		expect(circle.find('.vc-progress-circle__text').exists()).toBe(false);
	});

	it('circle: 0% 不画进度弧；中心文字为尺寸的 20%', async () => {
		const wrapper = mount(Progress, { props: { type: 'circle', percent: 0 } });

		expect(wrapper.find('.vc-progress-circle__track').exists()).toBe(true);
		expect(wrapper.find('.vc-progress-circle__path').exists()).toBe(false);
		expect(wrapper.find('.vc-progress-circle__box').attributes('style')).toContain('width: 120px');
		expect(wrapper.find('.vc-progress-circle__text').attributes('style')).toContain('font-size: 24px');

		await wrapper.setProps({ percent: 50, size: '10rem', textClass: 'custom' });
		expect(wrapper.find('.vc-progress-circle__path').exists()).toBe(true);
		expect(wrapper.find('.vc-progress-circle__text').attributes('style')).toMatch(/font-size: calc\(/);
		expect(wrapper.find('.vc-progress-circle__text span').classes()).toContain('custom');
	});

	it('MProgress: 标记类 vcm-progress，线高与圆形尺寸为 750 稿长度', async () => {
		const wrapper = mount(MProgress, { props: { percent: 50 } });

		expect(wrapper.classes()).toContain('vc-progress');
		expect(wrapper.classes()).toContain('vcm-progress');
		expect((wrapper.find('.vc-progress-line__box').element as HTMLElement).style.height).toBe('calc(var(--vc-rem) * 8)');

		await wrapper.setProps({ textInside: true });
		expect((wrapper.find('.vc-progress-line__box').element as HTMLElement).style.height).toBe('calc(var(--vc-rem) * 36)');

		await wrapper.setProps({ type: 'circle' });
		const box = wrapper.find('.vc-progress-circle__box').element as HTMLElement;
		expect(box.style.width).toBe('calc(var(--vc-rem) * 136)');
		expect(wrapper.find('svg path').attributes('stroke-width')).toBe('6');
	});
});
