// @vitest-environment jsdom

import { Switch } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Switch).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Switch />));

		expect(wrapper.classes()).toContain('vc-switch');
	});
});
