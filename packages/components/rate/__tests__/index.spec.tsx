// @vitest-environment jsdom

import { Rate } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Rate).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Rate />));

		expect(wrapper.classes()).toContain('vc-rate');
	});
});
