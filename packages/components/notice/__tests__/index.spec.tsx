// @vitest-environment jsdom

import { Notice, NoticeView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Notice).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<NoticeView />));

		expect(wrapper.classes()).toContain('vc-notice');
	});
});
