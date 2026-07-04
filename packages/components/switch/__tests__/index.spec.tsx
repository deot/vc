// @vitest-environment jsdom

import { Switch, MSwitch, Spin } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Switch).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Switch />));

		expect(wrapper.classes()).toContain('vc-switch');
	});

	it('checked', async () => {
		const wrapper = mount(() => <Switch modelValue={true} />);

		expect(wrapper.classes()).toContain('is-checked');
	});

	it('unchecked', async () => {
		const wrapper = mount(() => <Switch modelValue={false} />);

		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('disabled', async () => {
		const wrapper = mount(() => <Switch disabled />);

		expect(wrapper.classes()).toContain('is-disabled');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('toggle', async () => {
		const wrapper = mount(() => <Switch />);

		expect(wrapper.classes()).not.toContain('is-checked');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).toContain('is-checked');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('emit change, update:modelValue', async () => {
		let value: any;
		const wrapper = mount(() => (
			<Switch
				onChange={(v: any) => { value = v; }}
			/>
		));

		await wrapper.find('.vc-switch__wrapper').trigger('click');

		expect(value).toBe(true);
		expect(wrapper.findComponent(Switch).emitted()).toHaveProperty('change');
		expect(wrapper.findComponent(Switch).emitted()).toHaveProperty('update:modelValue');
	});

	it('checkedValue, uncheckedValue', async () => {
		let value: any;
		const wrapper = mount(() => (
			<Switch
				checkedValue="on"
				uncheckedValue="off"
				modelValue="off"
				onChange={(v: any) => { value = v; }}
			/>
		));

		expect(wrapper.classes()).not.toContain('is-checked');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(value).toBe('on');
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('checkedText, uncheckedText', async () => {
		const wrapper = mount(() => (
			<Switch
				modelValue={true}
				checkedText="开"
				uncheckedText="关"
			/>
		));

		expect(wrapper.find('.vc-switch__content').text()).toBe('开');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.find('.vc-switch__content').text()).toBe('关');
	});

	it('slots', async () => {
		const wrapper = mount(() => (
			<Switch
				modelValue={true}
				v-slots={{
					checked: () => <span class="custom-checked">ON</span>,
					unchecked: () => <span class="custom-unchecked">OFF</span>
				}}
			/>
		));

		expect(wrapper.find('.custom-checked').exists()).toBeTruthy();
		expect(wrapper.find('.custom-checked').text()).toBe('ON');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.find('.custom-unchecked').exists()).toBeTruthy();
		expect(wrapper.find('.custom-unchecked').text()).toBe('OFF');
	});

	it('name', async () => {
		const wrapper = mount(() => <Switch name="switch-name" />);

		const input = wrapper.find('input[type="hidden"]');
		expect(input.exists()).toBeTruthy();
		expect(input.attributes('name')).toBe('switch-name');
	});

	it('width, height, borderWidth', async () => {
		const wrapper = mount(() => <Switch width={40} height={22} borderWidth={2} />);

		expect(wrapper.attributes('style')).toContain('width: 40px');
		expect(wrapper.find('.vc-switch__wrapper').attributes('style')).toContain('height: 22px');
		expect(wrapper.find('.vc-switch__wrapper').attributes('style')).toContain('border-width: 2px');
	});

	it('modelValue sync', async () => {
		const wrapper = mount({
			props: { value: Boolean },
			setup(props) {
				return () => <Switch modelValue={props.value} />;
			}
		}, {
			props: { value: false }
		});

		expect(wrapper.classes()).not.toContain('is-checked');

		await wrapper.setProps({ value: true });
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('click, loading', async () => {
		const handler = () => {
			return new Promise((resolve) => {
				setTimeout(resolve, 10);
			});
		};

		const wrapper = mount(() => <Switch onClick={handler} />);

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).toContain('is-loading');
		expect(wrapper.findComponent(Spin).exists()).toBeTruthy();

		// loading 期间再次点击无效
		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');

		await Utils.sleep(20);
		expect(wrapper.classes()).not.toContain('is-loading');
		expect(wrapper.classes()).toContain('is-checked');
		expect(wrapper.findComponent(Spin).exists()).toBeFalsy();
	});

	it('click, prevent toggle when return truthy', async () => {
		const wrapper = mount(() => <Switch onClick={() => true} />);

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('reset by change callback', async () => {
		const wrapper = mount(() => (
			<Switch
				modelValue={false}
				onChange={(_v: any, _e: any, reset: any) => reset(false)}
			/>
		));

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('expose reset', async () => {
		const wrapper = mount(Switch);

		expect(typeof (wrapper.vm as any).reset).toBe('function');

		(wrapper.vm as any).reset(true);
		await wrapper.vm.$nextTick();
		expect(wrapper.classes()).toContain('is-checked');
	});
});

describe('mobile', () => {
	it('basic', () => {
		expect(typeof MSwitch).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => <MSwitch />);

		expect(wrapper.classes()).toContain('vcm-switch');
	});

	it('checked', async () => {
		const wrapper = mount(() => <MSwitch modelValue={true} checkedText="开" uncheckedText="关" />);

		expect(wrapper.classes()).toContain('is-checked');
		expect(wrapper.find('.vcm-switch__content').text()).toBe('开');
	});

	it('disabled', async () => {
		const wrapper = mount(() => <MSwitch disabled />);

		expect(wrapper.classes()).toContain('is-disabled');

		await wrapper.trigger('click');
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('toggle', async () => {
		const wrapper = mount(() => <MSwitch />);

		await wrapper.trigger('click');
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('slots', async () => {
		const wrapper = mount(() => (
			<MSwitch
				modelValue={true}
				v-slots={{
					checked: () => <span class="custom-checked">ON</span>,
					unchecked: () => <span class="custom-unchecked">OFF</span>
				}}
			/>
		));

		expect(wrapper.find('.custom-checked').exists()).toBeTruthy();

		await wrapper.trigger('click');
		expect(wrapper.find('.custom-unchecked').exists()).toBeTruthy();
	});

	it('click, loading', async () => {
		const handler = () => {
			return new Promise((resolve) => {
				setTimeout(resolve, 10);
			});
		};

		const wrapper = mount(() => <MSwitch onClick={handler} />);

		await wrapper.trigger('click');
		expect(wrapper.classes()).toContain('is-loading');
		expect(wrapper.find('.vcm-switch__loading').exists()).toBeTruthy();

		await Utils.sleep(20);
		expect(wrapper.classes()).not.toContain('is-loading');
		expect(wrapper.classes()).toContain('is-checked');
	});
});
