// @vitest-environment jsdom

import { Customer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

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
});
