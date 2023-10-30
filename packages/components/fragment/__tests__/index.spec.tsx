// @vitest-environment jsdom

import { Fragment as VFragment } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof VFragment).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<VFragment />));

		expect(wrapper.classes()).toContain('vc-fragment');
	});
});
