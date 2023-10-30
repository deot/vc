// @vitest-environment jsdom

import { Dropdown } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Dropdown).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Dropdown />));

		expect(wrapper.classes()).toContain('vc-dropdown');
	});
});
