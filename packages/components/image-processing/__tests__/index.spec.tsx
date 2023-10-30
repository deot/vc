// @vitest-environment jsdom

import { ImageProcessing } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof ImageProcessing).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ImageProcessing />));

		expect(wrapper.classes()).toContain('vc-image-processing');
	});
});
