// @vitest-environment jsdom

import { DrawerView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof DrawerView).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<DrawerView />));

		expect(wrapper.classes()).toContain('vc-drawer');
	});
});
