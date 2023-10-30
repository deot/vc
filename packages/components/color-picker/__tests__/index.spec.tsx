// @vitest-environment jsdom

import { ColorPicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof ColorPicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ColorPicker />));

		expect(wrapper.classes()).toContain('vc-color-picker');
	});
});
