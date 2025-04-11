// @vitest-environment jsdom

import { Alert } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Alert).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Alert />));
		await new Promise(_ => setTimeout(_, 300));
		expect(wrapper.html()).toContain('vc-alert');
	});
});
