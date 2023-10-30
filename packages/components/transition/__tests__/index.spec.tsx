// @vitest-environment jsdom

import { Transition } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Transition).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Transition />));

		expect(wrapper.classes()).toContain('vc-transition');
	});
});
