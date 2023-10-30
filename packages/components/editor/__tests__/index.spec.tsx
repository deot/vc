// @vitest-environment jsdom

import { Editor } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Editor).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Editor />));

		expect(wrapper.classes()).toContain('vc-editor');
	});
});
