// @vitest-environment jsdom

import { Drawer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Drawer).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Drawer />));

		expect(wrapper.classes()).toContain('vc-drawer');
	});
});
