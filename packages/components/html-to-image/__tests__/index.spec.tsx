// @vitest-environment jsdom

import { HTMLToImage } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof HTMLToImage).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<HTMLToImage />));

		expect(wrapper.classes()).toContain('vc-html-to-image');
	});
});
