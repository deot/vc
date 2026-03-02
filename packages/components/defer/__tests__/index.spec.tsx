// @vitest-environment jsdom

import { Defer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Defer).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Defer />));

		expect(wrapper.classes()).toEqual([]);
	});
});
