// @vitest-environment jsdom

import { TimePicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof TimePicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<TimePicker />));

		expect(wrapper.classes()).toContain('vc-time-picker');
	});
});
