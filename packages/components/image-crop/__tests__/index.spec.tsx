// @vitest-environment jsdom

import { ImageCrop } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof ImageCrop).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ImageCrop />));

		expect(wrapper.classes()).toContain('vc-image-crop');
	});
});
