// @vitest-environment jsdom

import { Tree } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tree).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Tree />));

		expect(wrapper.classes()).toContain('vc-tree');
	});
});
