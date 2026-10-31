// @vitest-environment jsdom

import { vi } from 'vitest';
import { Radio, RadioButton, RadioGroup, MRadio, MRadioButton, MRadioGroup } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

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
	it.each([Radio, RadioButton, MRadio])('standalone: uses trueValue/falseValue and reset', async (component) => {
		const wrapper = mount(component, { props: { modelValue: 'no', trueValue: 'yes', falseValue: 'no' } });
		const input = wrapper.find('input');
		expect((input.element as HTMLInputElement).checked).toBe(false);
		await input.setValue(true);
		expect(wrapper.emitted('change')?.[0]?.[0]).toBe('yes');
		expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('yes');
		const reset = wrapper.emitted('change')![0][2] as (checked: boolean) => void;
		reset(false);
		await nextTick();
		expect((input.element as HTMLInputElement).checked).toBe(false);
		await wrapper.setProps({ modelValue: 'yes' });
		expect((input.element as HTMLInputElement).checked).toBe(true);
		expect(wrapper.emitted('change')).toHaveLength(1);
	});

	it.each([Radio, RadioButton, MRadio])('standalone: emits true by default', async (component) => {
		const wrapper = mount(component);
		await wrapper.find('input').setValue(true);
		expect(wrapper.emitted('change')?.[0]?.[0]).toBe(true);
	});

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
	it('create: 外观固定为 button, 不渲染圆点', () => {
		const wrapper = mount(() => (<RadioButton label="apple" />));

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-radio', 'is-button', 'is-medium']));
		expect(wrapper.find('.vc-radio__border').exists()).toBe(false);
		expect(wrapper.find('.vc-radio__label').text()).toBe('apple');
	});

	it('slot: 优先渲染默认插槽', () => {
		const wrapper = mount(() => (
			<RadioButton label="apple" v-slots={{ default: () => 'banana' }} />
		));

		expect(wrapper.find('.vc-radio__label').text()).toBe('banana');
	});

	it('与圆点项混在同一组: 互斥选中', async () => {
		const onChange = vi.fn();
		const wrapper = mount({
			setup() {
				const current = ref('apple');
				return () => (
					<RadioGroup
						v-model={current.value}
						onChange={onChange}
						v-slots={{
							default: () => [
								<RadioButton label="apple" />,
								<RadioButton label="banana" />,
								<Radio label="none" />
							]
						}}
					/>
				);
			}
		});
		const radios = () => wrapper.findAll('.vc-radio');

		expect(radios()[0].classes()).toContain('is-button');
		expect(radios()[2].classes()).not.toContain('is-button');
		expect(radios()[2].find('.vc-radio__border').exists()).toBe(true);

		await wrapper.findAll('input')[2].trigger('change');
		expect(onChange).toHaveBeenCalledWith('none', expect.anything(), expect.any(Function));
		expect(radios()[0].classes()).not.toContain('is-checked');
		expect(radios()[2].classes()).toContain('is-checked');
	});

	it('不随分组 type 变化, 继承分组 size', () => {
		const wrapper = mount(() => (
			<RadioGroup
				type="card"
				size="small"
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<RadioButton label="banana" />
					]
				}}
			/>
		));
		const [radio, button] = wrapper.findAll('.vc-radio');

		expect(radio.classes()).toContain('is-card');
		expect(button.classes()).toContain('is-button');
		expect(button.classes()).not.toContain('is-card');
		expect(button.classes()).toContain('is-small');
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

	it('type=card: 添加 is-card 类', () => {
		const wrapper = mount(() => (<RadioGroup type="card" />));

		expect(wrapper.classes()).toContain('is-card');
	});

	it('type=default: 不添加类型类', () => {
		const wrapper = mount(() => (<RadioGroup />));

		expect(wrapper.classes()).not.toContain('is-default');
	});

	it.each(['button', 'card', 'capsule', 'text', 'round'] as const)('type=%s: 分组与子项添加类型类, 子项不渲染圆点', async (type) => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<RadioGroup
				type={type}
				modelValue="apple"
				onChange={onChange}
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<Radio label="banana" />
					]
				}}
			/>
		));

		expect(wrapper.classes()).toContain(`is-${type}`);
		expect(wrapper.findAll('.vc-radio').every(v => v.classes().includes(`is-${type}`))).toBe(true);
		expect(wrapper.find('.vc-radio__border').exists()).toBe(false);
		expect(wrapper.findAll('.vc-radio__label').map(v => v.text())).toEqual(['apple', 'banana']);

		await wrapper.findAll('input')[1].trigger('change');
		expect(onChange).toHaveBeenCalledWith('banana', expect.anything(), expect.any(Function));
	});

	it('size: 子项继承分组 size, 自身 size 优先', () => {
		const wrapper = mount(() => (
			<RadioGroup
				size="small"
				v-slots={{
					default: () => [
						<Radio label="apple" />,
						<Radio label="banana" size="large" />
					]
				}}
			/>
		));

		expect(wrapper.findAll('.vc-radio')[0].classes()).toContain('is-small');
		expect(wrapper.findAll('.vc-radio')[1].classes()).toContain('is-large');
	});

	it('size: 独立使用默认 medium', () => {
		const wrapper = mount(() => (<Radio />));

		expect(wrapper.classes()).toContain('is-medium');
	});

	it('size/type: 校验可选值', () => {
		const { size, type } = RadioGroup.props as any;

		expect(['mini', 'small', 'medium', 'large'].every(v => size.validator(v))).toBe(true);
		expect(size.validator('default')).toBe(false);
		expect(['default', 'button', 'card', 'capsule', 'text', 'round'].every(v => type.validator(v))).toBe(true);
		expect(type.validator('chip')).toBe(false);
		expect(type.validator('')).toBe(false);
		expect((Radio.props as any).size.validator('huge')).toBe(false);
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
	it('MRadioGroup: vertical class controls layout', () => {
		const wrapper = mount(MRadioGroup, { props: { vertical: true } });
		expect(wrapper.classes()).toContain('is-vertical');
	});

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
