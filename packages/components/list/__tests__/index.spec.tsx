// @vitest-environment jsdom

import { List } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof List).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<List />));

		expect(wrapper.classes()).toContain('vc-list');
	});
});
