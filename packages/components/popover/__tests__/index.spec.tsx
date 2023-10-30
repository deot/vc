// @vitest-environment jsdom

import { Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Popover).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Popover />));

		expect(wrapper.classes()).toContain('vc-popover');
	});
});
