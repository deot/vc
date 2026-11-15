// @vitest-environment jsdom

import { Dropdown, DropdownMenu, DropdownItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { MDropdown, MDropdownMenu, MDropdownItem } from '../index.m';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const getWrapperEl = () => document.querySelector('.vc-dropdown-wrapper') as HTMLElement | null;

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Dropdown).toBe('object');
		expect(typeof DropdownMenu).toBe('object');
		expect(typeof DropdownItem).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Dropdown />));

		expect(wrapper.classes()).toContain('vc-dropdown');
		wrapper.unmount();
	});

	it('class/style: 透传到根节点', () => {
		const wrapper = mount(() => (
			<Dropdown class="custom-dropdown" style={{ color: 'red' }} />
		));

		expect(wrapper.classes()).toContain('vc-dropdown');
		expect(wrapper.classes()).toContain('custom-dropdown');
		expect((wrapper.element as HTMLElement).style.color).toBe('red');
		wrapper.unmount();
	});
});

describe('DropdownMenu', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('渲染 ul.vc-dropdown-menu 并展示默认插槽', () => {
		const wrapper = mount(() => (
			<DropdownMenu>
				<li class="inner-item">item</li>
			</DropdownMenu>
		));

		expect(wrapper.element.tagName).toBe('UL');
		expect(wrapper.classes()).toContain('vc-dropdown-menu');
		expect(wrapper.find('.inner-item').exists()).toBe(true);
		wrapper.unmount();
	});
});

describe('DropdownItem', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('渲染 li.vc-dropdown-item', () => {
		const wrapper = mount(() => (<DropdownItem label="炸酱面" />));

		expect(wrapper.element.tagName).toBe('LI');
		expect(wrapper.classes()).toContain('vc-dropdown-item');
		wrapper.unmount();
	});

	it('label: 无默认插槽时渲染 label', () => {
		const wrapper = mount(() => (<DropdownItem label="驴打滚" />));

		expect(wrapper.text()).toBe('驴打滚');
		wrapper.unmount();
	});

	it('slot default: 优先渲染默认插槽', () => {
		const wrapper = mount(() => (
			<DropdownItem label="驴打滚">豆汁儿</DropdownItem>
		));

		expect(wrapper.text()).toBe('豆汁儿');
		wrapper.unmount();
	});

	it('selected: 渲染 is-selected 类名', () => {
		const wrapper = mount(() => (<DropdownItem selected />));

		expect(wrapper.classes()).toContain('is-selected');
		wrapper.unmount();
	});

	it('divided: 渲染 is-divided 类名', () => {
		const wrapper = mount(() => (<DropdownItem divided />));

		expect(wrapper.classes()).toContain('is-divided');
		wrapper.unmount();
	});

	it('disabled: 渲染 is-disabled 类名', () => {
		const wrapper = mount(() => (<DropdownItem disabled />));

		expect(wrapper.classes()).toContain('is-disabled');
		wrapper.unmount();
	});

	it('默认无状态类名', () => {
		const wrapper = mount(() => (<DropdownItem />));

		expect(wrapper.classes()).not.toContain('is-selected');
		expect(wrapper.classes()).not.toContain('is-divided');
		expect(wrapper.classes()).not.toContain('is-disabled');
		wrapper.unmount();
	});
});

describe('Dropdown 展开/收起', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('trigger="click": 点击展开菜单内容', async () => {
		const wrapper = mount(() => (
			<Dropdown trigger="click">
				{{
					default: () => <button class="trigger-btn">菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await nextTick();

		expect(getWrapperEl()).toBeNull();

		await wrapper.trigger('click');
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');
		expect(document.querySelector('.vc-dropdown-menu')).not.toBeNull();
		expect(document.querySelector('.vc-dropdown-item')).not.toBeNull();

		wrapper.unmount();
	});

	it('trigger="click": 再次点击收起', async () => {
		const wrapper = mount(() => (
			<Dropdown trigger="click">
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		await wrapper.trigger('click');
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('trigger="hover": mouseenter 展开, mouseleave 延时收起', async () => {
		const wrapper = mount(() => (
			<Dropdown trigger="hover">
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await nextTick();

		wrapper.element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
		await flush();
		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
		await sleep(220);
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});
});

describe('Dropdown v-model & 事件', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('v-model: 外部控制显隐', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click">
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		visible.value = false;
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('展开时触发 visible-change(true) / update:modelValue(true) / ready', async () => {
		const onReady = vi.fn();
		const onVisibleChange = vi.fn();
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Dropdown
				trigger="click"
				onReady={onReady}
				onVisibleChange={onVisibleChange}
				// @ts-ignore
				{...{ 'onUpdate:modelValue': onUpdate }}
			>
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(onReady).toHaveBeenCalled();
		expect(onVisibleChange).toHaveBeenCalledWith(true);
		expect(onUpdate).toHaveBeenCalledWith(true);

		wrapper.unmount();
	});
});

describe('DropdownItem 点击交互', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('点击 item: 同时触发 item 与 dropdown 的 click 事件', async () => {
		const onItemClick = vi.fn();
		const onDropdownClick = vi.fn();
		const visible = ref(true);
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click" onClick={onDropdownClick}>
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1" onClick={onItemClick}>驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const item = document.querySelector('.vc-dropdown-item') as HTMLElement;
		expect(item).not.toBeNull();
		item.click();
		await flush();

		expect(onItemClick).toHaveBeenCalledTimes(1);
		expect(onItemClick.mock.calls[0][0]).toBe('1');
		expect(onDropdownClick).toHaveBeenCalledTimes(1);
		expect(onDropdownClick.mock.calls[0][0]).toBe('1');

		wrapper.unmount();
	});

	it('点击 item(closable 默认 true): 收起 dropdown', async () => {
		const visible = ref(true);
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click" onVisibleChange={onVisibleChange}>
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1">驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const item = document.querySelector('.vc-dropdown-item') as HTMLElement;
		item.click();
		await flush();

		expect(visible.value).toBe(false);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
	});

	it('点击 item(closable=false): 不收起 dropdown', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click">
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1" closable={false}>驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const item = document.querySelector('.vc-dropdown-item') as HTMLElement;
		item.click();
		await flush();

		expect(visible.value).toBe(true);

		wrapper.unmount();
	});

	it('disabled item: 点击不触发事件也不收起', async () => {
		const onItemClick = vi.fn();
		const onDropdownClick = vi.fn();
		const visible = ref(true);
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click" onClick={onDropdownClick}>
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem value="1" disabled onClick={onItemClick}>驴打滚</DropdownItem>
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const item = document.querySelector('.vc-dropdown-item') as HTMLElement;
		item.click();
		await flush();

		expect(onItemClick).not.toHaveBeenCalled();
		expect(onDropdownClick).not.toHaveBeenCalled();
		expect(visible.value).toBe(true);

		wrapper.unmount();
	});

	it('value 缺省时使用 label 作为回调值', async () => {
		const onItemClick = vi.fn();
		const visible = ref(true);
		const wrapper = mount(() => (
			<Dropdown v-model={visible.value} trigger="click">
				{{
					default: () => <button>菜单</button>,
					content: () => (
						<DropdownMenu>
							<DropdownItem label="炸酱面" onClick={onItemClick} />
						</DropdownMenu>
					)
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const item = document.querySelector('.vc-dropdown-item') as HTMLElement;
		item.click();
		await flush();

		expect(onItemClick).toHaveBeenCalledTimes(1);
		expect(onItemClick.mock.calls[0][0]).toBe('炸酱面');

		wrapper.unmount();
	});
});

describe('Dropdown 固定区与滚动', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('header / footer 插槽与 scrollerOptions 透传给 Popover', async () => {
		const wrapper = mount(() => (
			<Dropdown
				modelValue={true}
				trigger="click"
				scrollerOptions={{ maxHeight: 120 }}
			>
				{{
					default: () => <button>btn</button>,
					header: () => <span class="d-header">header</span>,
					content: () => <span class="d-content">content</span>,
					footer: () => <span class="d-footer">footer</span>
				}}
			</Dropdown>
		), { attachTo: document.body });
		await flush();

		const popup = getWrapperEl()!;
		expect(popup.querySelector('.vc-popover-wrapper__header > .d-header')).not.toBeNull();
		expect(popup.querySelector('.vc-popover-wrapper__footer > .d-footer')).not.toBeNull();
		const content = popup.querySelector('.vc-popover-wrapper__content') as HTMLElement;
		expect(content.style.maxHeight).toBe('120px');
		expect(content.querySelector('.d-content')).not.toBeNull();
		expect(content.querySelector('.d-footer')).toBeNull();

		wrapper.unmount();
	});
});

describe('caret', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('默认不渲染；caret 时在触发内容之后渲染箭头，展开时根节点加 is-active', async () => {
		const plain = mount(() => (<Dropdown>菜单</Dropdown>));
		expect(plain.find('.vc-dropdown__icon').exists()).toBe(false);
		plain.unmount();

		const wrapper = mount(() => (
			<Dropdown caret trigger="click">
				{{
					default: () => <span class="label">菜单</span>,
					content: () => <DropdownMenu><DropdownItem label="驴打滚" /></DropdownMenu>
				}}
			</Dropdown>
		), { attachTo: document.body });
		const icon = wrapper.find('.vc-dropdown__icon');
		expect(icon.exists()).toBe(true);
		expect(wrapper.find('.label').element.nextElementSibling).toBe(icon.element);
		expect(wrapper.classes()).not.toContain('is-active');

		await wrapper.trigger('click');
		await flush();
		expect(wrapper.classes()).toContain('is-active');
		wrapper.unmount();
	});
});

describe('MDropdown', () => {
	const getMobileWrapper = () => [...document.querySelectorAll('.vcm-dropdown-wrapper')]
		.find(el => (el as HTMLElement).style.display !== 'none') as HTMLElement | undefined;

	const renderMenu = (props: Record<string, any> = {}, label = '菜单') => (
		<MDropdown caret {...props}>
			{{
				default: () => <span class={`trigger-${label}`}>{label}</span>,
				content: () => (
					<MDropdownMenu>
						<MDropdownItem value="1" label="驴打滚" selected />
						<MDropdownItem value="2" label="炸酱面" />
					</MDropdownMenu>
				)
			}}
		</MDropdown>
	);

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('与 Dropdown 结构相同，根节点、菜单、菜单项另有 vcm- 标记类；打开前不渲染弹层', async () => {
		const wrapper = mount(() => renderMenu(), { attachTo: document.body });
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-dropdown', 'vcm-dropdown']));
		expect(wrapper.find('.vc-dropdown__icon').exists()).toBe(true);
		expect(document.querySelector('.vcm-dropdown-wrapper')).toBeNull();

		await wrapper.trigger('click');
		await flush();
		const el = getMobileWrapper()!;
		expect(el).toBeTruthy();
		expect(el.parentElement).toBe(document.body);
		expect(el.querySelector('ul.vc-dropdown-menu.vcm-dropdown-menu')).not.toBeNull();
		const items = el.querySelectorAll('li.vc-dropdown-item.vcm-dropdown-item');
		expect(items.length).toBe(2);
		// 选中项右侧显示对勾
		expect(items[0].querySelector('.vc-dropdown-item__icon')).not.toBeNull();
		expect(items[1].querySelector('.vc-dropdown-item__icon')).toBeNull();
		wrapper.unmount();
	});

	it('桌面端 DropdownItem 选中时不显示对勾', () => {
		const wrapper = mount(() => (<DropdownItem selected label="驴打滚" />));
		expect(wrapper.find('.vc-dropdown-item__icon').exists()).toBe(false);
		wrapper.unmount();
	});

	it('弹层从触发区下沿开始；剩余空间不足时向上展开', async () => {
		const wrapper = mount(() => renderMenu(), { attachTo: document.body });
		const rect = { top: 100, bottom: 140, left: 0, right: 80, width: 80, height: 40, x: 0, y: 100 };
		const spy = vi.spyOn(wrapper.element, 'getBoundingClientRect').mockImplementation(() => rect as DOMRect);

		await wrapper.trigger('click');
		await flush();
		let el = getMobileWrapper()!;
		expect(el.classList).toContain('is-down');
		expect(el.style.top).toBe('140px');
		expect(el.style.bottom).toBe('0px');
		expect(el.querySelector('.vcm-popup')!.classList).toContain('is-top');

		await wrapper.trigger('click');
		await flush();

		// 靠近视口底部
		const bottom = window.innerHeight - 20;
		Object.assign(rect, { top: bottom - 40, bottom, y: bottom - 40 });
		await wrapper.trigger('click');
		await flush();
		el = getMobileWrapper()!;
		expect(el.classList).toContain('is-up');
		expect(el.style.top).toBe('0px');
		expect(el.style.bottom).toBe(`${window.innerHeight - (bottom - 40)}px`);
		expect(el.querySelector('.vcm-popup')!.classList).toContain('is-bottom');

		spy.mockRestore();
		wrapper.unmount();
	});

	it('点击菜单项触发 click 并关闭；点击蒙层、外部关闭', async () => {
		const onClick = vi.fn();
		const visible = ref(false);
		const props = () => ({
			'modelValue': visible.value,
			'onUpdate:modelValue': (v: boolean) => (visible.value = v),
			onClick
		});
		const wrapper = mount(() => renderMenu(props()), { attachTo: document.body });

		await wrapper.trigger('click');
		await flush();
		expect(visible.value).toBe(true);
		(getMobileWrapper()!.querySelectorAll('.vc-dropdown-item')[1] as HTMLElement).click();
		await flush();
		expect(onClick.mock.calls[0][0]).toBe('2');
		expect(visible.value).toBe(false);

		await wrapper.trigger('click');
		await flush();
		expect(visible.value).toBe(true);
		(getMobileWrapper()!.querySelector('.vcm-popup__mask') as HTMLElement).click();
		await flush();
		expect(visible.value).toBe(false);

		await wrapper.trigger('click');
		await flush();
		expect(visible.value).toBe(true);
		document.body.click();
		await flush();
		expect(visible.value).toBe(false);
		wrapper.unmount();
	});

	it('打开另一个时，前一个立即收起，新的蒙层不重新淡入', async () => {
		const wrapper = mount(() => (
			<div>
				{renderMenu({}, 'a')}
				{renderMenu({}, 'b')}
			</div>
		), { attachTo: document.body });
		const [a, b] = wrapper.findAll('.vcm-dropdown');

		await a.trigger('click');
		await flush();
		const first = getMobileWrapper()!;

		(b.element.querySelector('.trigger-b') as HTMLElement).click();
		await flush();
		await sleep(10);
		await flush();
		expect(a.classes()).not.toContain('is-active');
		expect(b.classes()).toContain('is-active');
		expect(first.style.display).toBe('none');
		const second = getMobileWrapper()!;
		expect(second).not.toBe(first);
		expect(second.classList).toContain('is-switched');
		wrapper.unmount();
	});

	it('disabled / trigger="custom"：点击触发区不打开', async () => {
		const disabled = mount(() => renderMenu({ disabled: true }), { attachTo: document.body });
		await disabled.trigger('click');
		await flush();
		expect(disabled.classes()).toEqual(expect.arrayContaining(['is-disabled']));
		expect(disabled.classes()).not.toContain('is-active');
		disabled.unmount();

		const custom = mount(() => renderMenu({ trigger: 'custom' }), { attachTo: document.body });
		await custom.trigger('click');
		await flush();
		expect(custom.classes()).not.toContain('is-active');
		custom.unmount();
	});
});
