// @vitest-environment jsdom

import { Select } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Select).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Select />));

		expect(wrapper.classes()).toContain('vc-select');
	});
});
