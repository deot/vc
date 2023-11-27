// @vitest-environment jsdom
import { ref } from 'vue';
import { Input, Icon } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Input).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Input />));

		expect(wrapper.classes()).toContain('vc-input');
	});

	it('styleless', async () => {
		const wrapper = mount(Input, {
			props: {
				styleless: true
			}
		});

		expect(wrapper.html()).toMatch(/^<input /);
	});

	it('events', async () => {
		const placeholder = '请输入';
		const current = ref('any');

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
		const wrapper = mount(Input, {
			props: {
				styleless: true,
				bytes: true,
				placeholder,
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
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});

		const el = wrapper.find('input').element;
		await wrapper.trigger('focus');

		expect(handleFocus).toHaveBeenCalledTimes(1);
		expect(handleUpdateModelValue).toHaveBeenCalledTimes(0);
		expect(el.placeholder).toBe(placeholder);
		expect(el.value).toBe(current.value);

		await wrapper.setProps({
			modelValue: 'text'
		});

		expect(el.value).toBe('text');
		expect(current.value).toBe('any');
		expect(handleUpdateModelValue).toHaveBeenCalledTimes(0);

		await wrapper.find('input').setValue('any1');
		expect(handleUpdateModelValue).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalledTimes(2);
		expect(handleInput).toHaveBeenCalledTimes(1);
		expect(handleBlur).toHaveBeenCalledTimes(0);
		expect(current.value).toBe('any1');

		await wrapper.trigger('blur');
		expect(handleBlur).toHaveBeenCalledTimes(1);
		expect(handleKeydown).toHaveBeenCalledTimes(0);
		expect(handleKeyup).toHaveBeenCalledTimes(0);
		expect(handleKeypress).toHaveBeenCalledTimes(0);
		expect(handleEnter).toHaveBeenCalledTimes(0);

		await wrapper.trigger('keydown');
		expect(handleKeydown).toHaveBeenCalledTimes(1);

		await wrapper.trigger('keypress');
		expect(handleKeypress).toHaveBeenCalledTimes(1);

		await wrapper.trigger('keyup', { keyCode: 13 });
		expect(handleKeyup).toHaveBeenCalledTimes(1);
		expect(handleEnter).toHaveBeenCalledTimes(1);

		await wrapper.trigger('paste', { clipboardData: { getData: () => '2' } });
		expect(handlePaste).toHaveBeenCalledTimes(1);
	});

	it('focusEnd', async () => {
		const handleFocus = vi.fn();
		const wrapper = mount(Input, {
			props: {
				styleless: true,
				focusEnd: true,
				modelValue: '',
				onFocus: handleFocus
			}
		});

		await wrapper.trigger('focus');
		expect(handleFocus).toHaveBeenCalledTimes(1);
	});

	it('maxlength', async () => {
		const handleFocus = vi.fn();
		const wrapper = mount(Input, {
			props: {
				styleless: true,
				bytes: true,
				maxlength: 11,
				modelValue: '',
				onFocus: handleFocus
			}
		});

		const el = wrapper.find('input').element;
		expect(el.maxLength).toBe(11);

		await wrapper.setProps({ maxlength: 12 });
		expect(el.maxLength).toBe(12);

	});

	it('event:clear', async () => {
		const current = ref('123');
		const handleClear = vi.fn();
		const handleInput = vi.fn();
		const handleChange = vi.fn();
		const handleUpdateModelValue = vi.fn((v) => {
			current.value = v;
		});

		const wrapper = mount(Input, {
			props: {
				clearable: true,
				modelValue: current.value,
				onClear: handleClear,
				onInput: handleInput,
				onChange: handleChange,
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});

		await wrapper.find('.vc-input__icon-clear').trigger('click');

		expect(handleClear).toBeCalledTimes(1);
		expect(handleInput).toBeCalledTimes(1);
		expect(handleChange).toBeCalledTimes(1);
		expect(handleUpdateModelValue).toBeCalledTimes(1);
		expect(current.value).toBe('');
	});

	it.skip('maxlength invaild', async () => {
		const handleInput = vi.fn();
		const current = ref('测试');

		const wrapper = mount(Input, {
			props: {
				maxlength: 2,
				bytes: true,
				modelValue: current.value,
				onInput: handleInput
			}
		});
		const el = wrapper.find('input').element;
		expect(el.maxLength).toBe(2);

		await wrapper.find('input').setValue('abcdfabcdfabcdf');
	});

	it('event:composition', async () => {
		const handleInput = vi.fn();
		const current = ref('');

		const wrapper = mount(Input, {
			props: {
				styleless: true,
				focusEnd: true,
				modelValue: current.value,
				onInput: handleInput
			}
		});

		await wrapper.trigger('compositionstart');
		wrapper.find('input').element.value = '1';
		await wrapper.trigger('compositionstart');
		await wrapper.trigger('input');
		wrapper.find('input').element.value = '2';
		await wrapper.trigger('compositionupdate');
		await wrapper.trigger('input');
		await wrapper.trigger('compositionend');
		expect(handleInput).toBeCalledTimes(1);
	});

	it('coverage', async () => {
		const placeholder = '请输入';
		const current = ref([]);

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
		const wrapper = mount(Input, {
			props: {
				styleless: true,
				bytes: true,
				placeholder,
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
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});


		await wrapper.trigger('keyup');
		expect(handleKeyup).toHaveBeenCalledTimes(1);
		expect(handleEnter).toHaveBeenCalledTimes(0);

		await wrapper.trigger('keyup', { keyCode: 108 });
		expect(handleKeyup).toHaveBeenCalledTimes(2);
		expect(handleEnter).toHaveBeenCalledTimes(1);
	});
});
