// @vitest-environment jsdom
import { ref, nextTick } from 'vue';
import { InputNumber } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof InputNumber).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(InputNumber);
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vc-input', 'vc-input-number']);

		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'vc-input-number']);
		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'is-disabled', 'vc-input-number']);
	});

	it('default: invalid value', async () => {
		const wrapper = mount(InputNumber, {
			props: {
				modelValue: 'any'
			}
		});

		expect(wrapper.find('input').element.value).toBe('any');
	});

	it('event:input', async () => {
		const current = ref('');
		const handleChange = vi.fn((v) => {
			current.value = v;
		});
		const wrapper = mount(InputNumber, {
			props: {
				modelValue: current.value,
				onChange: handleChange
			}
		});
		const input = wrapper.find('input');
		const el = input.element;
		await input.trigger('focus');

		await input.setValue('--');
		expect(el.value).toBe('-');
		expect(current.value).toBe('');

		await input.setValue('.');
		expect(el.value).toBe('');
		expect(current.value).toBe('');

		await wrapper.setProps({ precision: 2 });
		await input.setValue('.');
		expect(el.value).toBe('0.');
		expect(current.value).toBe(0);

		await input.setValue('0..');
		expect(el.value).toBe('0.');
		expect(current.value).toBe(0);

		await input.setValue('00');
		expect(el.value).toBe('0');
		expect(current.value).toBe(0);

		await input.setValue('abcd');
		expect(el.value).toBe('');
		expect(current.value).toBe('');

		await input.setValue('123');
		expect(el.value).toBe('123');
		expect(current.value).toBe(123);
		expect(handleChange).toHaveBeenCalled();
	});

	it('event:blur', async () => {
		const current = ref('1');
		const handleBlur = vi.fn((_, _targetValue, focusValue) => {
			expect(focusValue).toBe('1');
			expect(current.value).toBe(1000);
		});
		const wrapper = mount(() => (
			<InputNumber 
				v-model={current.value}
				styleless={true}
				step={1}
				precision={0}
				min={1000}
				clearable={true}
				// @ts-ignore
				onBlur={handleBlur}
			/>
		));

		await wrapper.trigger('focus');
		await wrapper.trigger('blur');
		expect(handleBlur).toHaveBeenCalledTimes(1);
	});

	it('event:blur', async () => {
		const current = ref('');
		const handleChange = vi.fn((v) => {
			current.value = v;
		});
		const wrapper = mount(InputNumber, {
			props: {
				modelValue: current.value,
				onChange: handleChange
			}
		});

		await wrapper.find('input').trigger('blur');
		expect(current.value).toBe('');

		await wrapper.setProps({
			required: true
		});

		await wrapper.find('input').trigger('blur');
		expect(current.value).toBe(0);

		await wrapper.setProps({
			min: 1000
		});

		await wrapper.find('input').trigger('blur');
		expect(current.value).toBe(1000);

		await wrapper.setProps({
			max: 9999
		});

		await wrapper.find('input').setValue(10000);
		expect(current.value).toBe(10000);

		await wrapper.find('input').trigger('keyup', { code: 'Enter' });
		expect(current.value).toBe(9999);
	});

	it('event:times', async () => {
		const current = ref('');
		const handleFocus = vi.fn();
		const handleBlur = vi.fn();
		const handleInput = vi.fn();
		const handleChange = vi.fn();
		const handleKeydown = vi.fn();
		const handleKeyup = vi.fn();
		const handleKeypress = vi.fn();
		const handleEnter = vi.fn();
		const handlePaste = vi.fn();
		const handleUpdateModelValue = vi.fn((v) => {
			current.value = v;
		});
		const handleClick = vi.fn();

		const wrapper = mount(InputNumber, {
			props: {
				modelValue: current.value,
				onFocus: handleFocus,
				onBlur: handleBlur,
				onInput: handleInput,
				onChange: handleChange,
				onKeydown: handleKeydown,
				onKeyup: handleKeyup,
				onKeypress: handleKeypress,
				onEnter: handleEnter,
				onPaste: handlePaste,
				onClick: handleClick,
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});

		const input = wrapper.find('input');
		await input.trigger('focus');
		expect(handleFocus).toHaveBeenCalledTimes(1);

		await input.trigger('blur');
		expect(handleFocus).toHaveBeenCalledTimes(1);

		await input.trigger('keyup', { code: 'Enter' });
		expect(handleKeyup).toHaveBeenCalledTimes(1);
		expect(handleEnter).toHaveBeenCalledTimes(1);

		expect(handleUpdateModelValue).toHaveBeenCalledTimes(0);

		await input.setValue('123');
		expect(handleUpdateModelValue).toHaveBeenCalledTimes(1);
		expect(handleInput).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledTimes(1);

		await input.trigger('click');
		expect(handleClick).toHaveBeenCalledTimes(1);

		await input.trigger('paste', { clipboardData: { getData: () => '2' } });
		expect(handlePaste).toHaveBeenCalledTimes(1);
	});

	it('event:blur', async () => {
		const current = ref('1');
		const handleBlur = vi.fn((_, _targetValue, focusValue) => {
			expect(focusValue).toBe('1');
			expect(current.value).toBe(1000);
		});
		const wrapper = mount(() => (
			<InputNumber 
				v-model={current.value}
				styleless={true}
				step={1}
				precision={0}
				min={1000}
				clearable={true}
				// @ts-ignore
				onBlur={handleBlur}
			/>
		));

		await wrapper.trigger('focus');
		await wrapper.trigger('blur');
		expect(handleBlur).toHaveBeenCalledTimes(1);
	});

	it('step', async () => {
		const current = ref('');
		const handleChange = vi.fn((v) => {
			current.value = v;
		});
		const wrapper = mount(InputNumber, {
			props: {
				step: 1,
				modelValue: current.value,
				onChange: handleChange
			}
		});
		let plusEl = wrapper.find('.vc-input-number__up');
		let minusEl = wrapper.find('.vc-input-number__down');

		await plusEl.trigger('click');
		expect(current.value).toBe(1);

		await minusEl.trigger('click');
		expect(current.value).toBe(0);
	});

	it('event: plus / minus', async () => {
		const current = ref(1);
		const wrapper = mount(() => {
			return (
				<InputNumber 
					v-model={current.value}
					min={0}
					max={2}
					// @ts-ignore
					onPlus={ () => current.value += 2 }
					onMinus={ () => current.value -= 2 }
				/>
			);
		});
		let plusEl = wrapper.find('.vc-input-number__up');
		let minusEl = wrapper.find('.vc-input-number__down');

		// 脱离min的限制
		await minusEl.trigger('click');
		expect(current.value).toBe(-1);

		await plusEl.trigger('click');
		expect(current.value).toBe(1);

		// 脱离max的限制
		await plusEl.trigger('click');
		expect(current.value).toBe(3);

		await plusEl.trigger('click');
		expect(current.value).toBe(5);
	});



	it('step: max', async () => {
		const current = ref(2);
		const handleTip = vi.fn();
		const wrapper = mount(() => {
			return (
				<InputNumber 
					v-model={current.value}
					min={0}
					max={2}
					// @ts-ignore
					onTip={handleTip}
				/>
			);
		});
		let plusEl = wrapper.find('.vc-input-number__up');
		await plusEl.trigger('click');
		expect(current.value).toBe(2);
		expect(handleTip).toBeCalledTimes(1);
	});

	it('step: min', async () => {
		const current = ref(0);
		const handleTip = vi.fn();
		const wrapper = mount(() => {
			return (
				<InputNumber 
					v-model={current.value}
					// @ts-ignore
					onTip={handleTip}
				/>
			);
		});
		let minusEl = wrapper.find('.vc-input-number__down');
		await minusEl.trigger('click');
		expect(current.value).toBe(0);
		expect(handleTip).toBeCalledTimes(1);
	});

	it('step: default invalid', async () => {
		const current = ref('a');
		const handleChange = vi.fn((v) => {
			current.value = v;
		});
		const wrapper = mount(InputNumber, {
			props: {
				step: 1,
				modelValue: current.value,
				onChange: handleChange
			}
		});
		let plusEl = wrapper.find('.vc-input-number__up');
		let minusEl = wrapper.find('.vc-input-number__down');

		await plusEl.trigger('click');
		expect(current.value).toBe('');

		// 禁用无法输入
		await minusEl.trigger('click');
		expect(current.value).toBe('');

		await plusEl.trigger('click');
		expect(current.value).toBe(1);

		await minusEl.trigger('click');
		expect(current.value).toBe(0);
	});

	it('controlled', async () => {
		const wrapper = mount(InputNumber, {
			props: {
				controllable: true
			}
		});
		await wrapper.find('input').setValue('123');
		await wrapper.find('input').trigger('blur');
		expect(wrapper.find('input').element.value).toBe('');

		await wrapper.setProps({
			modelValue: '12'
		});
		await wrapper.find('input').trigger('blur');
		expect(wrapper.find('input').element.value).toBe('12');
	});
});
