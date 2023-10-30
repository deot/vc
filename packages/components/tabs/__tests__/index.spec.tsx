// @vitest-environment jsdom

import { Tabs } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tabs).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Tabs />));

		expect(wrapper.classes()).toContain('vc-tabs');
	});
});
