// @vitest-environment jsdom

import { Upload } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Upload).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Upload />));

		expect(wrapper.classes()).toContain('vc-upload');
	});
});
