// @vitest-environment jsdom

import { Alert, Icon } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { nextTick } from 'vue';

const TITLE = '标题文案';
const DESC = '描述文案';

const waitTransition = () => Utils.sleep(300);

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Alert).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Alert />));

		await waitTransition();
		expect(wrapper.html()).toContain('vc-alert');
	});

	it('render & default type', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} />));

		await waitTransition();
		const root = wrapper.find('.vc-alert');
		expect(root.exists()).toBe(true);
		expect(root.classes()).toContain('is-info');
		expect(root.classes()).toContain('has-icon');
		expect(root.html()).toContain(TITLE);
	});

	it('type', async () => {
		const types = ['success', 'info', 'error', 'warning'] as const;
		for (const type of types) {
			const wrapper = mount(() => (<Alert title="test" type={type} />));

			await waitTransition();
			expect(wrapper.find('.vc-alert').classes()).toContain(`is-${type}`);
		}
	});

	it('desc (by prop)', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} desc={DESC} />));

		await waitTransition();
		expect(wrapper.find('.vc-alert').classes()).toContain('has-desc');
		expect(wrapper.html()).toContain(DESC);
	});

	it('title & desc support innerHTML', async () => {
		const wrapper = mount(() => (
			<Alert title="<span class='custom-title'>Hi</span>" desc="<span class='custom-desc'>Desc</span>" />
		));

		await waitTransition();
		expect(wrapper.find('.custom-title').exists()).toBe(true);
		expect(wrapper.find('.custom-desc').exists()).toBe(true);
	});

	it('icon (default shown)', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} />));

		await waitTransition();
		expect(wrapper.find('.vc-alert__icon').exists()).toBe(true);
		expect(wrapper.findComponent(Icon).exists()).toBe(true);
	});

	it('icon (hidden when icon=false)', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} icon={false} />));

		await waitTransition();
		expect(wrapper.find('.vc-alert').classes()).not.toContain('has-icon');
		expect(wrapper.find('.vc-alert__icon').exists()).toBe(false);
	});

	it('icon (custom type when icon is string)', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} icon="search" type="success" />));

		await waitTransition();
		const icon = wrapper.findComponent(Icon);
		expect(icon.exists()).toBe(true);
		expect(icon.props('type')).toBe('search');
	});

	it('closable', async () => {
		const wrapper = mount(() => (<Alert title={TITLE} closable />));

		await waitTransition();
		expect(wrapper.find('.vc-alert__close').exists()).toBe(true);
	});

	it('close emit', async () => {
		const wrapper = mount(Alert, {
			props: {
				title: TITLE,
				closable: true
			}
		});

		await waitTransition();
		await wrapper.find('.vc-alert__close').trigger('click');
		await nextTick();

		expect(wrapper.emitted('close')).toBeDefined();
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
		expect(wrapper.emitted('visible-change')?.[0]).toEqual([false]);
	});

	it('modelValue controls visibility', async () => {
		const wrapper = mount(Alert, {
			props: {
				title: TITLE,
				modelValue: false
			}
		});

		await waitTransition();
		expect(wrapper.find('.vc-alert').exists()).toBe(false);

		await wrapper.setProps({ modelValue: true });
		await waitTransition();
		expect(wrapper.find('.vc-alert').exists()).toBe(true);
	});

	it('default slot (as title fallback)', async () => {
		const wrapper = mount(Alert, {
			slots: {
				default: () => TITLE
			}
		});

		await waitTransition();
		expect(wrapper.html()).toContain(TITLE);
	});

	it('desc slot', async () => {
		const wrapper = mount(Alert, {
			props: { title: TITLE },
			slots: {
				desc: () => DESC
			}
		});

		await waitTransition();
		expect(wrapper.find('.vc-alert').classes()).toContain('has-desc');
		expect(wrapper.html()).toContain(DESC);
	});

	it('close slot', async () => {
		const wrapper = mount(Alert, {
			props: { title: TITLE, closable: true },
			slots: {
				close: () => (<span class="custom-close">X</span>)
			}
		});

		await waitTransition();
		expect(wrapper.find('.vc-alert__close .custom-close').exists()).toBe(true);
	});
});
