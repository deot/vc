// @vitest-environment jsdom

import { MList, MListItem, VcInstance } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	Object.defineProperty(window, 'open', { value: () => {} });
	it('basic', () => {
		expect(typeof MList).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<MList />));

		expect(wrapper.classes()).toContain('vcm-list');
	});

	it('props', async () => {
		const onClick = vi.fn();
		const wrapper = mount(() => {
			return (
				<MList>
					<MListItem
						labelWidth={100}
						class="item-1"
						arrow={true}
						label="姓名"
						to={() => {}}
					/>
					<MListItem
						class="item-2"
						label="姓名"
						extra="啦啦啦"
						arrow="left"
						href="/"
						onClick={onClick}
					/>
					<MListItem
						class="item-3"
						label="姓名"
					>
						{{
							label: () => {
								return (
									<div class="item-label">custom label</div>
								);
							},
							extra: () => {
								return (
									<div class="item-extra">custom extra</div>
								);
							}
						}}
					</MListItem>
				</MList>
			);
		});

		expect(wrapper.classes()).toContain('vcm-list');
		expect(wrapper.classes()).toContain('is-border');

		await wrapper.find('.item-1').trigger('click');
		await wrapper.find('.item-2').trigger('click');
		await wrapper.find('.item-3').trigger('click');
		expect(onClick).toHaveBeenCalledTimes(1);

		expect(wrapper.find('.item-label').text()).toBe('custom label');
		expect(wrapper.find('.item-extra').text()).toBe('custom extra');
	});

	it('VcInstance, to -> undefined', async () => {
		const to = vi.fn();
		VcInstance.configure({
			MListItem: {
				to
			}
		});
		const wrapper = mount(() => {
			return (
				<MList>
					<MListItem
						labelWidth={100}
						class="item-1"
						arrow={false}
						label="姓名"
						to="https://xx.com"
					/>
				</MList>
			);
		});

		await wrapper.find('.item-1').trigger('click');
		expect(to).toHaveBeenCalledTimes(1);
	});

	it('VcInstance, to -> truthy', async () => {
		const to = vi.fn(() => true);
		VcInstance.configure({
			MListItem: {
				to
			}
		});
		const wrapper = mount(() => {
			return (
				<MList>
					<MListItem
						labelWidth={100}
						class="item-1"
						arrow={false}
						label="姓名"
					/>
				</MList>
			);
		});

		await wrapper.find('.item-1').trigger('click');
		expect(to).toHaveBeenCalledTimes(1);
	});
});
