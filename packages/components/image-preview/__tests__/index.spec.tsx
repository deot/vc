// @vitest-environment jsdom

import { ImagePreview } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof ImagePreview).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ImagePreview />));

		expect(wrapper.classes()).toContain('vc-image-preview');
	});
});
