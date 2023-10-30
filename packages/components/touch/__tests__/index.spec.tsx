// @vitest-environment jsdom

import { Touch } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Touch).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Touch />));

		expect(wrapper.classes()).toContain('vc-touch');
	});
});
