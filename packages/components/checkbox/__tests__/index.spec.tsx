// @vitest-environment jsdom

import { vi } from 'vitest';
import { Checkbox, CheckboxGroup, MCheckbox, MCheckboxGroup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

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

	it('styleless: 仅渲染插槽内容, 不含包裹容器', () => {
		const wrapper = mount(() => (
			<CheckboxGroup styleless v-slots={{ default: () => (<Checkbox label="apple" />) }} />
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

	it('value 按 === 比较：字符串不匹配数字，勾选与取消一致', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<CheckboxGroup
				modelValue={['1']}
				onChange={onChange}
				v-slots={{ default: () => [<Checkbox value={1} label="One" />] }}
			/>
		));
		await nextTick();
		expect(wrapper.find('.vc-checkbox').classes()).not.toContain('is-checked');

		// 未勾选的项点击后是加入，而不是删掉字符串 '1'
		await wrapper.find('input').trigger('change');
		expect(onChange).toHaveBeenCalledWith(['1', 1], expect.anything(), expect.any(Function));
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

	it('MCheckboxGroup: styleless 仅渲染插槽内容', () => {
		const wrapper = mount(() => (
			<MCheckboxGroup styleless v-slots={{ default: () => (<MCheckbox value="apple" />) }} />
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

describe('shape', () => {
	it('平台默认：桌面 square，移动 circle', () => {
		expect(mount(() => (<Checkbox />)).classes()).toContain('is-square');
		expect(mount(() => (<MCheckbox />)).classes()).toContain('is-circle');
	});

	it('优先级：选项自身 > 组合 > 平台默认', () => {
		const wrapper = mount(() => (
			<CheckboxGroup
				shape="circle"
				v-slots={{
					default: () => [
						<Checkbox value="a" />,
						<Checkbox value="b" shape="square" />
					]
				}}
			/>
		));
		const items = wrapper.findAll('.vc-checkbox');
		expect(items[0].classes()).toContain('is-circle');
		expect(items[1].classes()).toContain('is-square');
		expect(items[1].classes()).not.toContain('is-circle');
	});
});

describe('group features', () => {
	it('disabled: 透传给全部选项', () => {
		const wrapper = mount(() => (
			<CheckboxGroup disabled v-slots={{ default: () => [<Checkbox value="a" />, <Checkbox value="b" />] }} />
		));
		wrapper.findAll('.vc-checkbox').forEach((item) => {
			expect(item.classes()).toContain('is-disabled');
		});
		wrapper.findAll('input').forEach((input) => {
			expect(input.attributes('disabled')).toBeDefined();
		});
	});

	it('vertical: 添加 is-vertical 类', () => {
		expect(mount(() => (<CheckboxGroup vertical />)).classes()).toContain('is-vertical');
		expect(mount(() => (<MCheckboxGroup vertical />)).classes()).toContain('is-vertical');
	});

	it('max: 达到上限后未选中的项禁用且不可选，取消后恢复', async () => {
		const value = ref<any[]>(['a', 'b']);
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<CheckboxGroup
				v-model={value.value}
				max={2}
				onChange={onChange}
				v-slots={{ default: () => ['a', 'b', 'c'].map(v => (<Checkbox value={v} />)) }}
			/>
		));
		await nextTick();

		const items = () => wrapper.findAll('.vc-checkbox');
		expect(items()[0].classes()).not.toContain('is-disabled');
		expect(items()[2].classes()).toContain('is-disabled');

		// 被禁用的项不响应
		await wrapper.findAll('input')[2].trigger('change');
		expect(onChange).not.toHaveBeenCalled();
		expect(value.value).toEqual(['a', 'b']);

		// 取消一项后恢复可选
		await wrapper.findAll('input')[0].trigger('change');
		await nextTick();
		expect(value.value).toEqual(['b']);
		expect(items()[2].classes()).not.toContain('is-disabled');
	});

	it('max: reset 也不超过上限', async () => {
		let reset: any;
		const value = ref<any[]>(['a']);
		const wrapper = mount(() => (
			<CheckboxGroup
				v-model={value.value}
				max={2}
				onChange={(_: any, __: any, r: any) => { reset = r; }}
				v-slots={{ default: () => ['a', 'b', 'c'].map(v => (<Checkbox value={v} />)) }}
			/>
		));
		await wrapper.findAll('input')[1].trigger('change');
		expect(value.value).toEqual(['a', 'b']);

		reset('c');
		expect(value.value).toEqual(['a', 'b']);
	});
});

describe('icon slot', () => {
	it('选项的 #icon 替换内置勾选框，参数含 checked / indeterminate / disabled', async () => {
		const wrapper = mount(() => (
			<Checkbox
				modelValue={true}
				indeterminate
				disabled
				v-slots={{ icon: (scope: any) => (<i class="icon" data-scope={JSON.stringify(scope)} />) }}
			/>
		));
		await nextTick();

		expect(wrapper.find('.vc-checkbox__border').exists()).toBe(false);
		expect(wrapper.find('input').exists()).toBe(true);
		expect(JSON.parse(wrapper.find('.icon').attributes('data-scope')!)).toEqual({ checked: true, indeterminate: true, disabled: true });
	});

	it('组合的 #icon 作用于组内选项，选项自身的优先', () => {
		const wrapper = mount(() => (
			<MCheckboxGroup
				modelValue={['a']}
				v-slots={{
					icon: ({ checked }: any) => (<i class={['group-icon', { on: checked }]} />),
					default: () => [
						<MCheckbox value="a" />,
						<MCheckbox value="b" v-slots={{ icon: () => (<i class="own-icon" />) }} />
					]
				}}
			/>
		));
		const items = wrapper.findAll('.vcm-checkbox');
		expect(items[0].find('.group-icon.on').exists()).toBe(true);
		expect(items[1].find('.group-icon').exists()).toBe(false);
		expect(items[1].find('.own-icon').exists()).toBe(true);
	});
});

describe('type / size', () => {
	it('默认：勾选框外观，size 为 medium', () => {
		const wrapper = mount(() => (<CheckboxGroup v-slots={{ default: () => (<Checkbox value="a" />) }} />));
		const item = wrapper.find('.vc-checkbox');
		expect(item.classes()).toContain('is-medium');
		expect(item.find('.vc-checkbox__border').exists()).toBe(true);
		expect(wrapper.classes()).not.toContain('is-default');
	});

	it('分组样式：没有勾选框，整项即按钮，可多选', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<MCheckboxGroup
				type="round"
				modelValue={['a']}
				onChange={onChange}
				v-slots={{ default: () => [<MCheckbox value="a" label="A" />, <MCheckbox value="b" label="B" />] }}
			/>
		));
		expect(wrapper.classes()).toContain('is-round');
		const items = wrapper.findAll('.vcm-checkbox');
		expect(items[0].classes()).toContain('is-round');
		expect(items[0].find('.vcm-checkbox__border').exists()).toBe(false);
		expect(items[0].find('.vcm-checkbox__label').text()).toBe('A');
		expect(items[0].find('input').classes()).toContain('vcm-checkbox__input');

		await wrapper.findAll('input')[1].trigger('change');
		expect(onChange).toHaveBeenCalledWith(['a', 'b'], expect.anything(), expect.any(Function));
	});

	it('分组样式不渲染 #icon 插槽', () => {
		const wrapper = mount(() => (
			<CheckboxGroup type="button" v-slots={{ icon: () => (<i class="icon" />), default: () => (<Checkbox value="a" />) }} />
		));
		expect(wrapper.find('.icon').exists()).toBe(false);
	});

	it('size：选项自身优先，其次分组', () => {
		const wrapper = mount(() => (
			<CheckboxGroup
				size="small"
				type="button"
				v-slots={{ default: () => [<Checkbox value="a" />, <Checkbox value="b" size="large" />] }}
			/>
		));
		const items = wrapper.findAll('.vc-checkbox');
		expect(items[0].classes()).toContain('is-small');
		expect(items[1].classes()).toContain('is-large');
		expect(mount(() => (<Checkbox size="mini" />)).classes()).toContain('is-mini');
	});
});
