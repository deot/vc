// @vitest-environment jsdom

import { Text } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Text).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Text />));

		expect(wrapper.classes()).toContain('vc-text');
	});
});
