// @vitest-environment jsdom

import { UploadPicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof UploadPicker).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<UploadPicker />));

		expect(wrapper.classes()).toContain('vc-upload-picker');
	});
});
