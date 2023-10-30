// @vitest-environment jsdom

import { Expand } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Expand).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Expand />));

		expect(wrapper.classes()).toContain('vc-expand');
	});
});
