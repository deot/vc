// @vitest-environment jsdom

import { Image } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Image).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Image />));

		expect(wrapper.classes()).toContain('vc-image');
	});
});
