// @vitest-environment jsdom

import { Checkbox } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Checkbox).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Checkbox />));

		expect(wrapper.classes()).toContain('vc-checkbox');
	});
});
