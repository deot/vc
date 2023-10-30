// @vitest-environment jsdom

import { Cascader } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Cascader).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Cascader />));

		expect(wrapper.classes()).toContain('vc-cascader');
	});
});
