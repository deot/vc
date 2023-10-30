// @vitest-environment jsdom

import { Page } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Page).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Page />));

		expect(wrapper.classes()).toContain('vc-page');
	});
});
