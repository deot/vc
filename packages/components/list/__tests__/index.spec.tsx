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

	it('indent: 按 750 稿，不传时由样式给出', async () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem class="item-1" label="a" />
				<MListItem class="item-2" label="b" indent={48} />
			</MList>
		));

		expect((wrapper.find('.item-1').element as HTMLElement).style.paddingLeft).toBe('');
		expect((wrapper.find('.item-2').element as HTMLElement).style.paddingLeft).toBe('calc(var(--vc-rem) * 48)');
	});

	it('header / footer：属性与插槽，列表项放在 __body 中', async () => {
		const wrapper = mount(() => (
			<MList header="标题" footer={() => <span class="custom-footer">说明</span>}>
				<MListItem label="a" />
			</MList>
		));

		const children = wrapper.element.children;
		expect(children[0].className).toBe('vcm-list__header');
		expect(children[0].textContent).toBe('标题');
		expect(children[1].className).toBe('vcm-list__body');
		expect(children[1].querySelector('.vcm-list-item')).not.toBeNull();
		expect(wrapper.find('.vcm-list__footer .custom-footer').text()).toBe('说明');

		const plain = mount(() => (<MList><MListItem label="a" /></MList>));
		expect(plain.find('.vcm-list__header').exists()).toBe(false);
		expect(plain.find('.vcm-list__footer').exists()).toBe(false);

		const slotted = mount(() => (
			<MList header="属性">
				{{
					header: () => <b class="slot-header">插槽</b>,
					default: () => <MListItem label="a" />
				}}
			</MList>
		));
		expect(slotted.find('.vcm-list__header').text()).toBe('插槽');
	});

	it('description：属性与插槽，带 is-description', async () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem class="item-1" label="a" description="描述" />
				<MListItem class="item-2" label="b">
					{{ description: () => <i class="slot-description">插槽描述</i> }}
				</MListItem>
				<MListItem class="item-3" label="c" />
			</MList>
		));

		expect(wrapper.find('.item-1 .vcm-list-item__description').text()).toBe('描述');
		expect(wrapper.find('.item-1 .vcm-list-item__wrapper').classes()).toContain('is-description');
		expect(wrapper.find('.item-2 .vcm-list-item__description .slot-description').exists()).toBe(true);
		expect(wrapper.find('.item-2 .vcm-list-item__wrapper').classes()).toContain('is-description');
		expect(wrapper.find('.item-3 .vcm-list-item__description').exists()).toBe(false);
		expect(wrapper.find('.item-3 .vcm-list-item__wrapper').classes()).not.toContain('is-description');
	});

	it('icon：字符串为 MIcon 类型，插槽优先', async () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem class="item-1" label="a" icon="search" />
				<MListItem class="item-2" label="b" icon="search">
					{{ icon: () => <img class="avatar" /> }}
				</MListItem>
				<MListItem class="item-3" label="c" />
			</MList>
		));

		expect(wrapper.find('.item-1 .vcm-list-item__icon .vcm-icon').exists()).toBe(true);
		expect(wrapper.find('.item-2 .vcm-list-item__icon .avatar').exists()).toBe(true);
		expect(wrapper.find('.item-2 .vcm-list-item__icon .vcm-icon').exists()).toBe(false);
		expect(wrapper.find('.item-3 .vcm-list-item__icon').exists()).toBe(false);
	});

	it('is-clickable：箭头、to、href 或监听 click 时生效', async () => {
		const wrapper = mount(() => (
			<MList>
				<MListItem class="item-arrow" label="a" />
				<MListItem class="item-to" label="b" arrow={false} to={() => {}} />
				<MListItem class="item-href" label="c" arrow={false} href="/" />
				<MListItem class="item-click" label="d" arrow={false} onClick={() => {}} />
				<MListItem class="item-static" label="e" arrow={false} />
			</MList>
		));

		['arrow', 'to', 'href', 'click'].forEach((key) => {
			expect(wrapper.find(`.item-${key}`).classes()).toContain('is-clickable');
		});
		expect(wrapper.find('.item-static').classes()).not.toContain('is-clickable');
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
		expect(to.mock.calls[0]).toHaveLength(1);
		expect((to.mock.calls[0] as any)[0].value).toBe('https://xx.com');
		expect((to.mock.calls[0] as any)[0].instance.type.name).toBe('vcm-list-item');
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
