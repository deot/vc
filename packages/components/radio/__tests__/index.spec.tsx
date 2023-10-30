// @vitest-environment jsdom

import { Radio } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Radio).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Radio />));

		expect(wrapper.classes()).toContain('vc-radio');
	});
});
