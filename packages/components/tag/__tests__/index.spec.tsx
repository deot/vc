// @vitest-environment jsdom

import { Tag } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tag).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Tag />));

		expect(wrapper.classes()).toContain('vc-tag');
	});
});
