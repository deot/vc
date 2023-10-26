// @vitest-environment jsdom

import { Spin } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Spin).toBe('object');
	});

	it('size', async () => {
		const wrapper = mount(() => (<Spin size={300} />));

		expect(wrapper.classes()).toContain('vc-spin');
		expect(wrapper.html()).toMatch('font-size: 300px');
	});
});
