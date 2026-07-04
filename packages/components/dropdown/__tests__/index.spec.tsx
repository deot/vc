// @vitest-environment jsdom

import { Dropdown, DropdownMenu, DropdownItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

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
