// @vitest-environment jsdom

import { Picker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Picker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Picker />));

		expect(wrapper.classes()).toContain('vc-picker');
	});
});
