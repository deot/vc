// @vitest-environment jsdom
import { ref, nextTick } from 'vue';
import { Input } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Input).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(Input);
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vc-input']);

		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus']);
		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'is-disabled']);
	});

	it('v-model', async () => {
		const current = ref('');
		const wrapper = mount(() => <Input v-model={current.value}/>);

		await wrapper.find('input').setValue('abc');

		expect(current.value).toBe('abc');
	});

	it('indicator:bytes', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Input 
				v-model={current.value} 
				maxlength={2} 
				bytes 
				indicator 
			/>
		));

		expect(wrapper.html()).toMatch('2/2');
	});

	it('indicator:inverted', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Input 
				v-model={current.value} 
				maxlength={2} 
				bytes 
				indicator={{ inverted: true, inline: true }}
			/>
		));

		expect(wrapper.html()).toMatch('0/2');
	});

	it('indicator:normal', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Input 
				v-model={current.value} 
				maxlength={2} 
				indicator
			/>
		));

		expect(wrapper.html()).toMatch('4/2');
	});

	it('indicator:normal', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Input 
				v-model={current.value} 
				indicator
			/>
		));

		expect(wrapper.html()).not.toMatch('4/2');
	});

	it('array', async () => {
		const current = ref<number[]>([]);
		const wrapper = mount(() => <Input v-model={current.value} maxlength={10} bytes />);

		current.value = [1, 2, 3];
		await nextTick();
		expect(wrapper.find('input').element.value).toBe('1,2,3');
	});

	it('number', async () => {
		const current = ref<number>(1);
		const wrapper = mount(() => <Input v-model={current.value} maxlength={1} bytes />);

		current.value = 223;
		await nextTick();
		expect(wrapper.find('input').element.value).toBe('223');
	});

	it('prepend', async () => {
		const wrapper = mount(() => <Input prepend="rmb" />);

		expect(wrapper.find('.vc-input__prepend').exists()).toBeTruthy();
	});

	it('append', async () => {
		const wrapper = mount(() => <Input append="rmb" />);

		expect(wrapper.find('.vc-input__append').exists()).toBeTruthy();
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
		const handleClick = vi.fn();
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
				onClick: handleClick,
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

		await wrapper.trigger('click');
		expect(handleClick).toHaveBeenCalledTimes(1);
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

	it('event:blur, focusValue', async () => {
		const current = ref('1');
		const handleBlur = vi.fn((_, targetValue, focusValue) => {
			expect(focusValue).toBe('1');
			expect(current.value).toBe('123');
		});
		const wrapper = mount(Input, {
			props: {
				styleless: true,
				modelValue: current.value,
				onBlur: handleBlur,
				'onUpdate:modelValue': (v) => {
					current.value = v;
				}
			}
		});

		await wrapper.trigger('focus');
		await wrapper.setValue('123');
		await wrapper.trigger('blur');
		expect(handleBlur).toHaveBeenCalledTimes(1);
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
				bytes: false,
				maxlength: 11,
				modelValue: '',
				onFocus: handleFocus
			}
		});

		const el = wrapper.find('input').element;
		expect(el.maxLength).toBe(11);

		await wrapper.setProps({ maxlength: 12 });
		expect(el.maxLength).toBe(12);

		await wrapper.setProps({ bytes: true });
		expect(el.maxLength).toBe(24);
	});

	it('maxlength: deleteContentBackward', async () => {
		const current = ref('abcd');
		const handleUpdateModelValue = vi.fn((v) => {
			current.value = v;
		});

		const wrapper = mount(Input, {
			props: {
				maxlength: 1,
				modelValue: current.value,
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});
		const el = wrapper.find('input').element;
		expect(el.maxLength).toBe(1);

		// 这两步模拟删除
		el.value = 'abc';
		await wrapper.find('input').trigger('input', { 
			inputType: "deleteContentBackward"
		});

		expect(handleUpdateModelValue).toBeCalledTimes(1);
		expect(current.value).toBe('abc');
	});


	it('maxlength: bytes', async () => {
		const handleInput = vi.fn();
		const current = ref('测试');
		const handleUpdateModelValue = vi.fn((v) => {
			current.value = v;
		});

		const wrapper = mount(Input, {
			props: {
				maxlength: 2,
				bytes: true,
				modelValue: current.value,
				onInput: handleInput,
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});
		const el = wrapper.find('input').element;
		expect(el.maxLength).toBe(2);

		// 由于长度过长, 会被截取
		await wrapper.find('input').setValue('abcdf');
		expect(current.value).toBe('abcd');
		expect(handleInput).toBeCalledTimes(1);
		expect(handleUpdateModelValue).toBeCalledTimes(1);

		await wrapper.find('input').setValue('测试s');
		expect(current.value).toBe('测试');
		expect(handleInput).toBeCalledTimes(2);
		expect(handleUpdateModelValue).toBeCalledTimes(2);

		await wrapper.find('input').setValue('abcd');
		expect(current.value).toBe('abcd');
		expect(handleInput).toBeCalledTimes(3);
		expect(handleUpdateModelValue).toBeCalledTimes(3);
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
