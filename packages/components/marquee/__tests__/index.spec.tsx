// @vitest-environment jsdom

import { Marquee } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

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
});
