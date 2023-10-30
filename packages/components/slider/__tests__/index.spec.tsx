// @vitest-environment jsdom

import { Slider } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Slider).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Slider />));

		expect(wrapper.classes()).toContain('vc-slider');
	});
});
