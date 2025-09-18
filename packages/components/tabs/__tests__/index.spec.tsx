// @vitest-environment jsdom

import { Tabs, TabsPane } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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
				<TabsPane value="" label="Empty" />
				<TabsPane value="foo" label="Foo" />
			</Tabs>
		));

		await nextTick();

		const items = wrapper.findAll('.vc-tabs__item');
		expect(items[0].classes()).toContain('is-active');

		await items[1].trigger('click');
		await nextTick();

		expect(onUpdate).toHaveBeenCalledWith('foo');
		expect(items[1].classes()).toContain('is-active');
	});
});
