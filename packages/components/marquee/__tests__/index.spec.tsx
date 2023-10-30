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
});
