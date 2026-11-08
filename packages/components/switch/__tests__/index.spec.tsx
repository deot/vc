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

		// 两段文字都渲染（轨道宽度取较宽的一段），只显示当前的一段
		const texts = () => wrapper.findAll('.vc-switch__text').map(item => [item.text(), item.classes('is-hidden')]);
		expect(texts()).toEqual([['开', false], ['关', true]]);

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(texts()).toEqual([['开', true], ['关', false]]);
	});

	it('text, unset', async () => {
		const wrapper = mount(() => <Switch checkedText="开" />);

		// 未设置的一段不渲染
		expect(wrapper.findAll('.vc-switch__text').map(item => item.text())).toEqual(['开']);
		expect(mount(() => <Switch />).find('.vc-switch__text').exists()).toBeFalsy();
	});

	it('text padding and thumb position', async () => {
		const wrapper = mount(() => <Switch width={40} height={24} borderWidth={2} checkedText="开" />);
		const track = wrapper.find('.vc-switch__wrapper').element as HTMLElement;
		const content = wrapper.find('.vc-switch__content').element as HTMLElement;
		const inner = wrapper.find('.vc-switch__inner').element as HTMLElement;

		expect(track.style.minWidth).toBe('40px');
		// 滑块 24 - 2 * 4 = 16；离滑块、轨道边缘各 24 / 4
		expect(content.style.padding).toBe('0px 6px 0px 24px');
		expect(inner.style.left).toBe('2px');

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(content.style.padding).toBe('0px 24px 0px 6px');
		expect(inner.style.left).toBe('calc(100% - 18px)');
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

		// width 是轨道的最小宽度，文字较长时轨道随之加宽
		expect(wrapper.attributes('style')).toBeUndefined();
		expect(wrapper.find('.vc-switch__wrapper').attributes('style')).toContain('min-width: 40px');
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

	it('loading inside the thumb', async () => {
		const wrapper = mount(() => <Switch height={28} onClick={() => new Promise(resolve => setTimeout(resolve, 10))} />);

		await wrapper.find('.vc-switch__wrapper').trigger('click');
		expect(wrapper.find('.vc-switch__inner .vc-switch__loading').exists()).toBeTruthy();
		// 占滑块（28 - 4 = 24）的 3 / 4
		expect(wrapper.find('.vc-switch__loading svg').attributes('style')).toContain('width: 18px');
		await Utils.sleep(20);
	});

	it('aria', async () => {
		const wrapper = mount(() => <Switch />);
		const track = wrapper.find('.vc-switch__wrapper');

		expect(track.attributes('role')).toBe('switch');
		expect(track.attributes('aria-checked')).toBe('false');
		expect(track.attributes('aria-disabled')).toBe('false');
		expect(track.attributes('tabindex')).toBe('0');

		await track.trigger('click');
		expect(track.attributes('aria-checked')).toBe('true');

		const disabled = mount(() => <Switch disabled />).find('.vc-switch__wrapper');
		expect(disabled.attributes('aria-disabled')).toBe('true');
		expect(disabled.attributes('tabindex')).toBe('-1');
	});

	it('keyboard', async () => {
		const wrapper = mount(() => <Switch />);
		const track = wrapper.find('.vc-switch__wrapper');

		await track.trigger('keydown', { key: ' ' });
		expect(wrapper.classes()).toContain('is-checked');

		await track.trigger('keydown', { key: 'Enter' });
		expect(wrapper.classes()).not.toContain('is-checked');

		// 按住不放与其他按键不切换
		await track.trigger('keydown', { key: 'Enter', repeat: true });
		await track.trigger('keydown', { key: 'a' });
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('keyboard, disabled', async () => {
		const wrapper = mount(() => <Switch disabled />);

		await wrapper.find('.vc-switch__wrapper').trigger('keydown', { key: ' ' });
		expect(wrapper.classes()).not.toContain('is-checked');
	});

	it('keyboard, loading', async () => {
		const wrapper = mount(() => <Switch onClick={() => new Promise(resolve => setTimeout(resolve, 10))} />);

		await wrapper.find('.vc-switch__wrapper').trigger('keydown', { key: 'Enter' });
		expect(wrapper.classes()).toContain('is-loading');

		await Utils.sleep(20);
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
		expect(wrapper.find('.vcm-switch__text:not(.is-hidden)').text()).toBe('开');
		expect(wrapper.find('.vcm-switch__text.is-hidden').text()).toBe('关');
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
		expect(wrapper.find('.vcm-switch__inner .vcm-switch__loading').exists()).toBeTruthy();

		await Utils.sleep(20);
		expect(wrapper.classes()).not.toContain('is-loading');
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('aria, keyboard', async () => {
		const wrapper = mount(() => <MSwitch />);

		expect(wrapper.attributes('role')).toBe('switch');
		expect(wrapper.attributes('aria-checked')).toBe('false');
		expect(wrapper.attributes('tabindex')).toBe('0');

		await wrapper.trigger('keydown', { key: ' ' });
		expect(wrapper.classes()).toContain('is-checked');
		expect(wrapper.attributes('aria-checked')).toBe('true');

		const disabled = mount(() => <MSwitch disabled />);
		expect(disabled.attributes('aria-disabled')).toBe('true');
		expect(disabled.attributes('tabindex')).toBe('-1');
	});
});
