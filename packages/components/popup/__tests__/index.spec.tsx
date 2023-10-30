// @vitest-environment jsdom

import { Popup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Popup).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Popup />));

		expect(wrapper.classes()).toContain('vc-popup');
	});
});
