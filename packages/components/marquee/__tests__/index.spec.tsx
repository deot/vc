// @vitest-environment jsdom

import { Marquee, MMarquee } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Marquee).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Marquee />));

		expect(wrapper.classes()).toContain('vc-marquee');
	});
	it('renders the default slot before content', () => {
		const wrapper = mount(Marquee, {
			props: { content: 'fallback' },
			slots: { default: '<span>slot content</span>' }
		});

		expect(wrapper.find('.vc-marquee__content span').text()).toBe('slot content');
		expect(wrapper.text()).not.toContain('fallback');
	});
	it('does not duplicate content when it fits', () => {
		const wrapper = mount(Marquee, { props: { content: 'a' } });
		expect(wrapper.findAll('.vc-marquee__content').length).toBe(1);
		expect(wrapper.classes()).not.toContain('is-running');
	});
	it('runs when content overflows, then stops with animated false', async () => {
		const sizes = { offsetWidth: 300, offsetHeight: 300, clientWidth: 100, clientHeight: 100 };
		const spies = Object.entries(sizes).map(([key, value]) => vi.spyOn(HTMLElement.prototype, key as any, 'get').mockReturnValue(value));
		const wrapper = mount(Marquee, { props: { content: 'a', delay: 500, gap: 10, speed: 100 } });
		await nextTick();
		const style = (wrapper.element as HTMLElement).style;
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-running', 'is-pause-on-hover', 'is-left', 'is-horizontal']));
		expect(wrapper.findAll('.vc-marquee__content')[1].attributes('aria-hidden')).toBe('true');
		expect(style.getPropertyValue('--vc-marquee-duration')).toBe('3s');
		expect(style.getPropertyValue('--vc-marquee-delay')).toBe('500ms');
		expect(style.getPropertyValue('--vc-marquee-gap')).toBe('10px');

		await wrapper.find('.vc-marquee__track').trigger('animationiteration');
		expect(wrapper.emitted('loop')).toHaveLength(1);

		await wrapper.setProps({ animated: false });
		expect(wrapper.classes()).not.toContain('is-running');
		expect(wrapper.findAll('.vc-marquee__content').length).toBe(1);

		const vertical = mount(MMarquee, { props: { content: 'a', direction: 'up' } });
		await nextTick();
		expect(vertical.classes()).toEqual(expect.arrayContaining(['vcm-marquee', 'is-vertical', 'is-running']));
		vertical.unmount();
		wrapper.unmount();
		spies.forEach(spy => spy.mockRestore());
	});
});
