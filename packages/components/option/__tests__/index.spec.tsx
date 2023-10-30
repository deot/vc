// @vitest-environment jsdom

import { Option } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Option).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Option />));

		expect(wrapper.classes()).toContain('vc-option');
	});
});
