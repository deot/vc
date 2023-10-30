// @vitest-environment jsdom

import { Steps } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Steps).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Steps />));

		expect(wrapper.classes()).toContain('vc-steps');
	});
});
