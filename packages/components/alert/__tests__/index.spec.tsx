// @vitest-environment jsdom

import { Alert } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Alert).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Alert />));

		expect(wrapper.classes()).toContain('vc-alert');
	});
});
