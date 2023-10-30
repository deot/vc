// @vitest-environment jsdom

import { Input } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Input).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Input />));

		expect(wrapper.classes()).toContain('vc-input');
	});
});
