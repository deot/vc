// @vitest-environment jsdom

import { DatePicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof DatePicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<DatePicker />));

		expect(wrapper.classes()).toContain('vc-date-picker');
	});
});
