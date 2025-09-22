// @vitest-environment jsdom

import { Tabs, TabsPane } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { vi } from 'vitest';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tabs).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Tabs />));

		expect(wrapper.classes()).toContain('vc-tabs');
	});

	it('accepts empty string tab values', async () => {
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Tabs
				modelValue=""
				onUpdate:modelValue={onUpdate}
			>
				<TabsPane value="any" label="Any" />
				<TabsPane value="" label="Empty" />
			</Tabs>
		));

		await Utils.sleep(1);

		const items = wrapper.findAll('.vc-tabs__item');
		expect(items[1].classes()).toContain('is-active');

		await items[0].trigger('click');
		await Utils.sleep(1);

		expect(onUpdate).toHaveBeenCalledWith('any');
		expect(items[0].classes()).toContain('is-active');
	});
});
