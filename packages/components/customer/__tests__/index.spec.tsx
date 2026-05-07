// @vitest-environment jsdom

import { Customer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import { vi } from 'vitest';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Customer).toBe('object');
		const wrapper = mount(Customer, {});
		expect(wrapper.html()).toBe('');
	});
	it('create', async () => {
		const onClick = vi.fn();
		const onCustomerClick = vi.fn();
		const wrapper = mount(Customer, {
			props: {
				current: 0,
				render: (props, { attrs, slots, emit }) => {
					return (
						<ul class="child" onClick={e => emit('customer-click', e)}>
							<li class="attrs">{ attrs.current }</li>
							<li class="props">{ props?.current }</li>
							<li class="default">{ slots.default?.() }</li>
							<li class="content">{ slots.content?.({ current: ((props.current as number) + 1) }) }</li>
						</ul>
					);
				}
			},
			attrs: {
				class: 'parent',
				onClick,
				onCustomerClick,
			},
			slots: {
				default: () => 'default-slot',
				content: scoped => `content-slot-${scoped.current}`,
			}
		});

		expect(wrapper.classes()).toEqual(['child', 'parent']);
		expect(wrapper.find('.attrs').text()).toBe('0');
		expect(wrapper.find('.props').text()).toBe('0');
		expect(wrapper.find('.default').text()).toBe('default-slot');
		expect(wrapper.find('.content').text()).toBe('content-slot-1');

		await wrapper.setProps({ current: 1 } as any);

		expect(wrapper.classes()).toEqual(['child', 'parent']);
		expect(wrapper.find('.attrs').text()).toBe('1');
		expect(wrapper.find('.props').text()).toBe('1');
		expect(wrapper.find('.default').text()).toBe('default-slot');
		expect(wrapper.find('.content').text()).toBe('content-slot-2');

		await wrapper.trigger('click');

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(onCustomerClick).toHaveBeenCalledTimes(1);
	});

	it('render reconciliation', async () => {
		const renderItem = vi.fn((props: any) => <div class="item">{ props.index }</div>);
		const renderList = vi.fn((props: any) => {
			const { length } = props;
			return (
				<div class="list">
					{
						Array.from({ length }, (_, i) => i + 1).map(item => (
							<Customer key={item} render={renderItem} index={item} />
						))
					}
				</div>
			);
		});

		const wrapper = mount(Customer, {
			props: {
				length: 100,
				render: renderList
			}
		});

		expect(renderList).toHaveBeenCalledTimes(1);
		expect(renderItem).toHaveBeenCalledTimes(100);
		expect(wrapper.find('.list').exists()).toBe(true);
		expect(wrapper.findAll('.item').length).toBe(100);

		// 确保新增1条数据后renderItem只执行1次，而不是执行101次
		await wrapper.setProps({ length: 101 } as any);

		expect(renderList).toHaveBeenCalledTimes(2);
		expect(renderItem).toHaveBeenCalledTimes(101);
		expect(wrapper.findAll('.item').length).toBe(101);
	});
});
