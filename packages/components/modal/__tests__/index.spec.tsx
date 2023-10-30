// @vitest-environment jsdom

import { Modal } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Modal).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Modal />));

		expect(wrapper.classes()).toContain('vc-modal');
	});
});
