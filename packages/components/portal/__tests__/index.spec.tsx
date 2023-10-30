// @vitest-environment jsdom

import { Portal } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Portal).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Portal />));

		expect(wrapper.classes()).toContain('vc-portal');
	});
});
