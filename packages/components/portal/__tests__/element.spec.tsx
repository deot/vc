// @vitest-environment jsdom

import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { MDropdown, MDropdownItem, MDropdownMenu, MNotice, Notice, Popover, PortalView, VcInstance, Watermark } from '@deot/vc-components';
import { getPortalElement, resolvePortalElement } from '../utils';

/**
 * VcInstance.options.Portal.element 是所有弹层的默认挂载点：命令式（Portal）、声明式 Teleport 与自建容器都跟随它
 */
describe('Portal.element 作为全部弹层的默认挂载点', () => {
	let host: HTMLElement;
	const original = { ...VcInstance.options.Portal };

	beforeEach(() => {
		host = document.createElement('div');
		host.className = 'overlay-host';
		document.body.appendChild(host);
		VcInstance.configure({ Portal: { ...original, element: host } });
	});

	afterEach(() => {
		VcInstance.configure({ Portal: { ...original } });
		Notice.destroy();
		MNotice.destroy();
		document.body.innerHTML = '';
	});

	it('getPortalElement / resolvePortalElement：读取配置，缺省为 body', () => {
		expect(getPortalElement()).toBe(host);
		expect(resolvePortalElement()).toBe(host);

		VcInstance.configure({ Portal: { ...original, element: '.overlay-host' } });
		expect(getPortalElement()).toBe('.overlay-host');
		expect(resolvePortalElement()).toBe(host);

		VcInstance.configure({ Portal: { ...original, element: '.missing' } });
		expect(resolvePortalElement()).toBe(document.body);

		VcInstance.configure({ Portal: { ...original } });
		expect(getPortalElement()).toBe('body');
		expect(resolvePortalElement()).toBe(document.body);
	});

	it('Popover：声明式浮层挂到 Portal.element；传了 to 时以 to 为准', async () => {
		const wrapper = mount(() => (
			<Popover modelValue={true} content="x" portalClass="is-default">
				<span>trigger</span>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		await Utils.sleep(20);
		expect(host.querySelector('.is-default')).toBeTruthy();
		wrapper.unmount();

		const target = document.createElement('section');
		document.body.appendChild(target);
		const wrapper$ = mount(() => (
			<Popover modelValue={true} content="x" to={target} portalClass="is-to">
				<span>trigger</span>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		await Utils.sleep(20);
		expect(target.querySelector('.is-to')).toBeTruthy();
		expect(host.querySelector('.is-to')).toBeNull();
		wrapper$.unmount();
	});

	it('Popover.open：命令式浮层同样挂到 Portal.element', async () => {
		const trigger = document.createElement('button');
		document.body.appendChild(trigger);
		const leaf = Popover.open({ triggerElement: trigger, content: 'x', portalClass: 'is-open' });
		await nextTick();
		await Utils.sleep(20);
		expect(host.querySelector('.is-open')).toBeTruthy();
		leaf.destroy();
	});

	it('PortalView：content 插槽传送到 Portal.element', async () => {
		const wrapper = mount(() => (
			<PortalView>
				{{ content: () => <i class="portal-view-content" /> }}
			</PortalView>
		), { attachTo: document.body });
		await nextTick();
		expect(host.querySelector('.portal-view-content')).toBeTruthy();
		wrapper.unmount();
	});

	it('MDropdown：浮层传送到 Portal.element', async () => {
		const value = ref(true);
		const wrapper = mount(() => (
			<MDropdown v-model={value.value}>
				{{
					default: () => <span>trigger</span>,
					content: () => (
						<MDropdownMenu>
							<MDropdownItem>选项一</MDropdownItem>
						</MDropdownMenu>
					)
				}}
			</MDropdown>
		), { attachTo: document.body });
		await nextTick();
		await Utils.sleep(20);
		expect(host.querySelector('.vcm-dropdown-wrapper')).toBeTruthy();
		wrapper.unmount();
	});

	it.each([
		['Notice', Notice, '.vc-notice-portals'],
		['MNotice', MNotice, '.vcm-notice-portals']
	])('%s：堆叠容器挂到 Portal.element，关闭后移除', async (_, component: any, selector) => {
		component.info({ title: 't', content: 'c', duration: 0 });
		await nextTick();
		expect(host.querySelector(selector)).toBeTruthy();
		expect(document.body.querySelector(`:scope > ${selector}`)).toBeNull();
	});

	it('Watermark：fullscreen 时挂到 Portal.element', async () => {
		const wrapper = mount(() => <Watermark content="水印" fullscreen />, { attachTo: document.body });
		await nextTick();
		await Utils.sleep(20);
		expect(host.children.length).toBeGreaterThan(0);
		wrapper.unmount();
	});
});
