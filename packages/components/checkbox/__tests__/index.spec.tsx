// @vitest-environment jsdom

import { vi } from 'vitest';
import { Checkbox, CheckboxGroup, MCheckbox, MCheckboxGroup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Checkbox).toBe('object');
		expect(typeof CheckboxGroup).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Checkbox />));

		expect(wrapper.classes()).toContain('vc-checkbox');
	});
});

describe('checkbox.tsx', () => {
	it('label: 渲染文本内容', () => {
		const wrapper = mount(() => (<Checkbox label="apple" />));

		expect(wrapper.text()).toBe('apple');
	});

	it('value: label 缺省时展示 value', () => {
		const wrapper = mount(() => (<Checkbox value="apple" />));

		expect(wrapper.text()).toBe('apple');
	});

	it('slot: 优先渲染默认插槽', () => {
		const wrapper = mount(() => (
			<Checkbox label="apple" v-slots={{ default: () => 'banana' }} />
		));

		expect(wrapper.text()).toBe('banana');
	});

	it('name: 透传到 input', () => {
		const wrapper = mount(() => (<Checkbox name="fruit" />));

		expect(wrapper.find('input').attributes('name')).toBe('fruit');
	});

	it('indeterminate: 添加 is-indeterminate 类', () => {
		const wrapper = mount(() => (<Checkbox indeterminate />));

		expect(wrapper.classes()).toContain('is-indeterminate');
	});

	it('modelValue: 匹配 checkedValue 时添加 is-checked 类', async () => {
		const wrapper = mount(() => (<Checkbox modelValue={true} />));
		await nextTick();

		expect(wrapper.classes()).toContain('is-checked');
	});

	it('disabled: 添加 is-disabled 类并禁用 input', () => {
		const wrapper = mount(() => (<Checkbox disabled />));

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('input').attributes('disabled')).toBeDefined();
	});

	it('disabled: 点击不触发事件', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<Checkbox disabled onChange={onChange} />));

		await wrapper.find('input').trigger('change');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('change: 选中时触发 update:modelValue 与 change', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Checkbox onUpdate:modelValue={onUpdate} onChange={onChange} />
		));

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(onUpdate).toHaveBeenCalledWith(true, expect.anything(), expect.any(Function));
		expect(onChange).toHaveBeenCalledWith(true, expect.anything(), expect.any(Function));
		expect(wrapper.classes()).toContain('is-checked');
	});

	it('checkedValue/uncheckedValue: 自定义选中值', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Checkbox checkedValue="yes" uncheckedValue="no" onChange={onChange} />
		));

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(onChange).toHaveBeenCalledWith('yes', expect.anything(), expect.any(Function));
	});

	it('focus/blur: 切换 is-focus 类', async () => {
		const wrapper = mount(() => (<Checkbox />));

		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toContain('is-focus');

		await wrapper.find('input').trigger('blur');
		expect(wrapper.classes()).not.toContain('is-focus');
	});
});

describe('checkbox-group.tsx', () => {
	it('create', () => {
		const wrapper = mount(() => (<CheckboxGroup />));

		expect(wrapper.classes()).toContain('vc-checkbox-group');
	});

	it('fragment: 仅渲染插槽内容, 不含包裹容器', () => {
		const wrapper = mount(() => (
			<CheckboxGroup fragment v-slots={{ default: () => (<Checkbox label="apple" />) }} />
		));

		expect(wrapper.find('.vc-checkbox-group').exists()).toBe(false);
		expect(wrapper.find('.vc-checkbox').exists()).toBe(true);
	});

	it('modelValue: 高亮匹配的子项', async () => {
		const wrapper = mount(() => (
			<CheckboxGroup
				modelValue={['apple']}
				v-slots={{
					default: () => [
						<Checkbox label="apple" />,
						<Checkbox label="banana" />
					]
				}}
			/>
		));
		await nextTick();

		const checkboxes = wrapper.findAll('.vc-checkbox');
		expect(checkboxes[0].classes()).toContain('is-checked');
		expect(checkboxes[1].classes()).not.toContain('is-checked');
	});

	it('change: 选中子项触发 update:modelValue 与 change', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<CheckboxGroup
				modelValue={['apple']}
				onUpdate:modelValue={onUpdate}
				onChange={onChange}
				v-slots={{
					default: () => [
						<Checkbox label="apple" />,
						<Checkbox label="banana" />
					]
				}}
			/>
		));

		await wrapper.findAll('input')[1].trigger('change');

		expect(onUpdate).toHaveBeenCalledWith(['apple', 'banana'], expect.anything(), expect.any(Function));
		expect(onChange).toHaveBeenCalledWith(['apple', 'banana'], expect.anything(), expect.any(Function));
	});

	it('change: 取消已选中的子项', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<CheckboxGroup
				modelValue={['apple']}
				onChange={onChange}
				v-slots={{
					default: () => [
						<Checkbox label="apple" />,
						<Checkbox label="banana" />
					]
				}}
			/>
		));

		await wrapper.findAll('input')[0].trigger('change');

		expect(onChange).toHaveBeenCalledWith([], expect.anything(), expect.any(Function));
	});
});

describe('mobile', () => {
	it('basic', () => {
		expect(typeof MCheckbox).toBe('object');
		expect(typeof MCheckboxGroup).toBe('object');
	});

	it('MCheckbox: 渲染与文本', () => {
		const wrapper = mount(() => (<MCheckbox label="apple" />));

		expect(wrapper.classes()).toContain('vcm-checkbox');
		expect(wrapper.text()).toBe('apple');
	});

	it('MCheckbox: disabled 添加 is-disabled 类', () => {
		const wrapper = mount(() => (<MCheckbox disabled />));

		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('input').attributes('disabled')).toBeDefined();
	});

	it('MCheckbox: 选中时触发 change', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (<MCheckbox onChange={onChange} />));

		const input = wrapper.find('input');
		(input.element as HTMLInputElement).checked = true;
		await input.trigger('change');

		expect(onChange).toHaveBeenCalled();
	});

	it('MCheckboxGroup: 渲染容器', () => {
		const wrapper = mount(() => (<MCheckboxGroup />));

		expect(wrapper.classes()).toContain('vcm-checkbox-group');
	});

	it('MCheckboxGroup: fragment 仅渲染插槽内容', () => {
		const wrapper = mount(() => (
			<MCheckboxGroup fragment v-slots={{ default: () => (<MCheckbox value="apple" />) }} />
		));

		expect(wrapper.find('.vcm-checkbox-group').exists()).toBe(false);
		expect(wrapper.find('.vcm-checkbox').exists()).toBe(true);
	});

	it('MCheckboxGroup: 选中子项触发 change', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<MCheckboxGroup
				modelValue={['apple']}
				onChange={onChange}
				v-slots={{
					default: () => [
						<MCheckbox value="apple" />,
						<MCheckbox value="banana" />
					]
				}}
			/>
		));

		await wrapper.findAll('input')[1].trigger('change');

		expect(onChange).toHaveBeenCalledWith(['apple', 'banana'], expect.anything(), expect.any(Function));
	});
});
