// @vitest-environment jsdom

import { Toast } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Toast).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Toast />));

		expect(wrapper.classes()).toContain('vc-toast');
	});
});
