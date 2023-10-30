// @vitest-environment jsdom

import { Customer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Customer).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Customer />));

		expect(wrapper.classes()).toContain('vc-customer');
	});
});
