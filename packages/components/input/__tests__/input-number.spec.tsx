// @vitest-environment jsdom
import { ref } from 'vue';
import { InputNumber, MInputNumber } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

const NULL_VALUE = void 0;
describe('index-number.ts', () => {
	it('basic', () => {
		expect(typeof InputNumber).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(InputNumber, {
			slots: {
				prepend: () => 'any'
			}
		});
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vc-input', 'vc-input-number']);
		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'vc-input-number']);
		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'is-disabled', 'vc-input-number']);
		expect(wrapper.find('.vc-input__prepend').text()).toBe('any');
	});

	it('create, m-input-number', async () => {
		const wrapper = mount(MInputNumber);
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vcm-input', 'vcm-input-number']);

		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toEqual(['vcm-input', 'is-focus', 'vcm-input-number']);
		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toEqual(['vcm-input', 'is-focus', 'is-disabled', 'vcm-input-number']);
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
		expect(current.value).toBe(NULL_VALUE);

		await input.setValue('.');
		expect(el.value).toBe('');
		expect(current.value).toBe(NULL_VALUE);

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
		expect(current.value).toBe(NULL_VALUE);

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
		expect(current.value).toBe(NULL_VALUE);

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
		const current = ref(NULL_VALUE);
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
				'modelValue': current.value,
				'onFocus': handleFocus,
				'onBlur': handleBlur,
				'onInput': handleInput,
				'onChange': handleChange,
				'onKeydown': handleKeydown,
				'onKeyup': handleKeyup,
				'onKeypress': handleKeypress,
				'onEnter': handleEnter,
				'onPaste': handlePaste,
				'onClick': handleClick,
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

	it('event:after:reject', async () => {
		const current = ref('1');
		const handleAfter = vi.fn(() => {
			return Promise.reject();
		});
		const wrapper = mount(() => (
			<InputNumber
				v-model={current.value}
				// @ts-ignore
				onAfter={handleAfter}
			/>
		));

		await wrapper.find('input').setValue(123);
		await wrapper.find('input').trigger('blur');
		expect(handleAfter).toHaveBeenCalledTimes(1);
		expect(current.value).toBe('1');
	});

	it('event:after:resolve', async () => {
		const current = ref('1');
		const handleAfter = vi.fn(() => {
			return Promise.resolve();
		});
		const wrapper = mount(() => (
			<InputNumber
				v-model={current.value}
				// @ts-ignore
				onAfter={handleAfter}
			/>
		));

		await wrapper.find('input').setValue(123);
		await wrapper.find('input').trigger('blur');
		expect(handleAfter).toHaveBeenCalledTimes(1);
		expect(current.value).toBe(123);
	});

	it('event:after:false', async () => {
		const current = ref('1');
		const handleAfter = vi.fn(() => {
			return false;
		});
		const wrapper = mount(() => (
			<InputNumber
				v-model={current.value}
				// @ts-ignore
				onAfter={handleAfter}
			/>
		));

		await wrapper.find('input').setValue(123);
		await wrapper.find('input').trigger('blur');
		expect(handleAfter).toHaveBeenCalledTimes(1);
		expect(current.value).toBe('1');
	});

	it('event:after:debounce', async () => {
		const current = ref('1');
		const handleAfter = vi.fn(() => {
			return Promise.resolve();
		});
		const wrapper = mount(() => (
			<InputNumber
				v-model={current.value}
				// @ts-ignore
				onAfter={handleAfter}
			/>
		));

		const plusEl = wrapper.find('.vc-input-number__up');

		await plusEl.trigger('click');
		await plusEl.trigger('click');
		await plusEl.trigger('click');
		await plusEl.trigger('click');

		expect(current.value).toBe(5);
		await new Promise((_) => { setTimeout(_, 500); });

		expect(handleAfter).toHaveBeenCalledTimes(1);
		expect(current.value).toBe(5);
	});

	it('event:after:debounce:reject', async () => {
		const current = ref('1');
		const handleAfter = vi.fn(() => {
			return Promise.reject();
		});
		const wrapper = mount(() => (
			<InputNumber
				v-model={current.value}
				// @ts-ignore
				onAfter={handleAfter}
			/>
		));

		const plusEl = wrapper.find('.vc-input-number__up');

		await plusEl.trigger('click');
		await plusEl.trigger('click');
		await plusEl.trigger('click');
		await plusEl.trigger('click');

		expect(current.value).toBe(5);
		await new Promise((_) => { setTimeout(_, 500); });

		expect(handleAfter).toHaveBeenCalledTimes(1);
		expect(current.value).toBe('1');
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
		const plusEl = wrapper.find('.vc-input-number__up');
		const minusEl = wrapper.find('.vc-input-number__down');

		await plusEl.trigger('click');
		expect(current.value).toBe(1);

		await minusEl.trigger('click');
		expect(current.value).toBe(0);
	});

	it('step, m-input-number', async () => {
		const current = ref('');
		const handleChange = vi.fn((v) => {
			current.value = v;
		});
		const wrapper = mount(MInputNumber, {
			props: {
				step: 1,
				max: 1,
				modelValue: current.value,
				onChange: handleChange
			}
		});
		const plusEl = wrapper.find('.vcm-input-number__plus');
		const minusEl = wrapper.find('.vcm-input-number__minus');

		await plusEl.trigger('click');
		expect(current.value).toBe(1);

		await minusEl.trigger('click');
		expect(current.value).toBe(0);
	});

	it('step:0, m-input-number', async () => {
		const wrapper = mount(MInputNumber, {
			props: {
				step: 0,
			}
		});

		expect(wrapper.find('.vcm-input-number__plus').exists()).toBeFalsy();
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
					onPlus={() => current.value += 2}
					onMinus={() => current.value -= 2}
				/>
			);
		});
		const plusEl = wrapper.find('.vc-input-number__up');
		const minusEl = wrapper.find('.vc-input-number__down');

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
		const plusEl = wrapper.find('.vc-input-number__up');
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
		const minusEl = wrapper.find('.vc-input-number__down');
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
		const plusEl = wrapper.find('.vc-input-number__up');
		const minusEl = wrapper.find('.vc-input-number__down');

		await plusEl.trigger('click');
		expect(current.value).toBe(NULL_VALUE);

		// 禁用无法输入
		await minusEl.trigger('click');
		expect(current.value).toBe(0);

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
