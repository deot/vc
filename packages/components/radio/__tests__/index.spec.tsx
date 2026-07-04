// @vitest-environment jsdom

import { vi } from 'vitest';
import { Radio, RadioButton, RadioGroup, MRadio, MRadioButton, MRadioGroup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Radio).toBe('object');
		expect(typeof RadioButton).toBe('object');
		expect(typeof RadioGroup).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Radio />));

		expect(wrapper.classes()).toContain('vc-radio');
	});
});

describe('radio.tsx', () => {
	it('label: 渲染文本内容', () => {
		const wrapper = mount(() => (<Radio label="apple" />));

		expect(wrapper.text()).toBe('apple');
	});

	it('slot: 优先渲染默认插槽', () => {
		const wrapper = mount(() => (
			<Radio label="apple" v-slots={{ default: () => 'banana' }} />
		));

		expect(wrapper.text()).toBe('banana');
	});

	it('name: 透传到 input', () => {
		const wrapper = mount(() => (<Radio name="fruit" />));

		expect(wrapper.find('input').attributes('name')).toBe('fruit');
	});

	it('disabled: 添加 is-disabled 类并禁用 input', () => {
		const wrapper = mount(() => (<Radio disabled />));

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('input').attributes('disabled')).toBeDefined();
	});

	it('disabled: 点击不触发事件', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<Radio disabled onChange={onChange} />));

		await wrapper.find('input').trigger('change');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('change: 选中时触发 update:modelValue 与 change', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Radio onUpdate:modelValue={onUpdate} onChange={onChange} />
		));

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(onUpdate).toHaveBeenCalled();
		expect(onChange).toHaveBeenCalled();
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('focus/blur: 切换 is-focus 类', async () => {
		const wrapper = mount(() => (<Radio />));

		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toContain('is-focus');

		await wrapper.find('input').trigger('blur');
		expect(wrapper.classes()).not.toContain('is-focus');
	});
});

describe('radio-button.tsx', () => {
	it('create', () => {
		const wrapper = mount(() => (<RadioButton label="apple" />));

		expect(wrapper.classes()).toContain('vc-radio-button');
		expect(wrapper.find('.vc-radio-button__label').text()).toBe('apple');
	});

	it('labelClass/labelStyle: 应用到 label', () => {
		const wrapper = mount(() => (
			<RadioButton label="apple" labelClass="my-label" labelStyle={{ color: 'rgb(255, 0, 0)' }} />
		));

		const label = wrapper.find('.vc-radio-button__label');
		expect(label.classes()).toContain('my-label');
		expect(label.attributes('style')).toContain('rgb(255, 0, 0)');
	});

	it('slot: 优先渲染默认插槽', () => {
		const wrapper = mount(() => (
			<RadioButton label="apple" v-slots={{ default: () => 'banana' }} />
		));

		expect(wrapper.find('.vc-radio-button__label').text()).toBe('banana');
	});
});

describe('radio-group.tsx', () => {
	it('create', () => {
		const wrapper = mount(() => (<RadioGroup />));

		expect(wrapper.classes()).toContain('vc-radio-group');
	});

	it('vertical: 添加 is-vertical 类', () => {
		const wrapper = mount(() => (<RadioGroup vertical />));

		expect(wrapper.classes()).toContain('is-vertical');
	});

	it('type=button: 添加 is-button 类', () => {
		const wrapper = mount(() => (<RadioGroup type="button" />));

		expect(wrapper.classes()).toContain('is-button');
	});

	it('name: 透传到容器', () => {
		const wrapper = mount(() => (<RadioGroup name="fruit" />));

		expect(wrapper.attributes('name')).toBe('fruit');
	});

	it('fragment: 仅渲染插槽内容, 不含包裹容器', () => {
		const wrapper = mount(() => (
			<RadioGroup fragment v-slots={{ default: () => (<Radio label="apple" />) }} />
		));

		expect(wrapper.find('.vc-radio-group').exists()).toBe(false);
		expect(wrapper.find('.vc-radio').exists()).toBe(true);
	});

	it('modelValue: 高亮匹配的子项', async () => {
		const wrapper = mount(() => (
			<RadioGroup
				modelValue="apple"
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<Radio label="banana" />
					]
				}}
			/>
		));
		await nextTick();

		const radios = wrapper.findAll('.vc-radio');
		expect(radios[0].classes()).toContain('is-checked');
		expect(radios[1].classes()).not.toContain('is-checked');
	});

	it('change: 选中子项触发 update:modelValue 与 change', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<RadioGroup
				modelValue="apple"
				onUpdate:modelValue={onUpdate}
				onChange={onChange}
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<Radio label="banana" />
					]
				}}
			/>
		));

		await wrapper.findAll('input')[1].trigger('change');

		expect(onUpdate).toHaveBeenCalledWith('banana', expect.anything(), expect.any(Function));
		expect(onChange).toHaveBeenCalledWith('banana', expect.anything(), expect.any(Function));
	});

	it('disabled: 禁用组内所有子项', () => {
		const wrapper = mount(() => (
			<RadioGroup
				disabled
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<Radio label="banana" />
					]
				}}
			/>
		));

		const radios = wrapper.findAll('.vc-radio');
		expect(radios[0].classes()).toContain('is-disabled');
		expect(radios[1].classes()).toContain('is-disabled');
		expect(wrapper.findAll('input').every(v => v.attributes('disabled') !== undefined)).toBe(true);
	});

	it('name: 组内子项共享 name', () => {
		const wrapper = mount(() => (
			<RadioGroup
				name="fruit"
				v-slots={{
					default: () => (<Radio label="apple" />)
				}}
			/>
		));

		expect(wrapper.find('.vc-radio input').attributes('name')).toBe('fruit');
	});
});

describe('mobile', () => {
	it('basic', () => {
		expect(typeof MRadio).toBe('object');
		expect(typeof MRadioGroup).toBe('object');
		expect(MRadioButton).toBe(MRadio);
	});

	it('MRadio: 渲染与文本', () => {
		const wrapper = mount(() => (<MRadio label="apple" />));

		expect(wrapper.classes()).toContain('vcm-radio');
		expect(wrapper.text()).toBe('apple');
	});

	it('MRadio: disabled 添加 is-disabled 类', () => {
		const wrapper = mount(() => (<MRadio disabled />));

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('input').attributes('disabled')).toBeDefined();
	});

	it('MRadio: 选中时触发 change', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<MRadio onChange={onChange} />));

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(onChange).toHaveBeenCalled();
	});

	it('MRadioGroup: 渲染容器', () => {
		const wrapper = mount(() => (<MRadioGroup />));

		expect(wrapper.classes()).toContain('vcm-radio-group');
	});

	it('MRadioGroup: fragment 仅渲染插槽内容', () => {
		const wrapper = mount(() => (
			<MRadioGroup fragment v-slots={{ default: () => (<MRadio value="apple" />) }} />
		));

		expect(wrapper.find('.vcm-radio-group').exists()).toBe(false);
		expect(wrapper.find('.vcm-radio').exists()).toBe(true);
	});

	it('MRadioGroup: 选中子项触发 change', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<MRadioGroup
				modelValue="apple"
				onChange={onChange}
				v-slots={{
					default: () => [
						<MRadio value="apple" />,
						<MRadio value="banana" />
					]
				}}
			/>
		));

		await wrapper.findAll('input')[1].trigger('change');

		expect(onChange).toHaveBeenCalledWith('banana', expect.anything(), expect.any(Function));
	});
});
