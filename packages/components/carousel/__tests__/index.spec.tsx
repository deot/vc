// @vitest-environment jsdom

import { Carousel } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Carousel).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Carousel />));

		expect(wrapper.classes()).toContain('vc-carousel');
	});
});
