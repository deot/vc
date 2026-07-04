// @vitest-environment jsdom

import { ref, nextTick } from 'vue';
import { Textarea, MTextarea } from '@deot/vc-components';
import { Resize } from '@deot/helper-resize';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Textarea).toBe('object');
		expect(typeof MTextarea).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(Textarea);
		const vm = wrapper.vm as any;

		expect(wrapper.classes()).toContain('vc-textarea');
		expect(wrapper.find('.vc-textarea__wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-textarea__content').exists()).toBe(true);
		expect(wrapper.find('textarea').exists()).toBe(true);

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(typeof vm.refresh).toBe('function');
	});

	it('create, m-textarea', async () => {
		const wrapper = mount(() => (<MTextarea />));

		expect(wrapper.classes()).toContain('vcm-textarea');
		expect(wrapper.find('.vcm-textarea__wrapper').exists()).toBe(true);
		expect(wrapper.find('textarea').exists()).toBe(true);
	});

	it('classes:focus/blur/disabled', async () => {
		const wrapper = mount(Textarea);

		expect(wrapper.classes()).toEqual(['vc-textarea']);

		await wrapper.find('textarea').trigger('focus');
		expect(wrapper.classes()).toContain('is-focus');

		await wrapper.find('textarea').trigger('blur');
		expect(wrapper.classes()).not.toContain('is-focus');

		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('textarea').element.disabled).toBe(true);
	});

	it('v-model', async () => {
		const current = ref('');
		const wrapper = mount(() => <Textarea v-model={current.value} />);

		await wrapper.find('textarea').setValue('abc');
		expect(current.value).toBe('abc');
		expect(wrapper.find('textarea').element.value).toBe('abc');
	});

	it('props:rows/wrap', async () => {
		const wrapper = mount(() => <Textarea rows={5} wrap="hard" />);
		const el = wrapper.find('textarea').element;

		expect(el.rows).toBe(5);
		expect(el.getAttribute('wrap')).toBe('hard');
	});

	it('props:textareaStyle', async () => {
		const wrapper = mount(() => <Textarea textareaStyle={{ resize: 'none' }} />);
		expect(wrapper.find('textarea').attributes('style')).toContain('resize: none');
	});

	it('indicator:normal', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Textarea
				v-model={current.value}
				maxlength={10}
				indicator
			/>
		));

		expect(wrapper.find('.vc-textarea__indicator').exists()).toBe(true);
		expect(wrapper.html()).toMatch('4/10');
	});

	it('indicator:inverted', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Textarea
				v-model={current.value}
				maxlength={10}
				indicator={{ inverted: true }}
			/>
		));

		expect(wrapper.html()).toMatch('6/10');
	});

	it('indicator:bytes', async () => {
		const current = ref('abcd');
		const wrapper = mount(() => (
			<Textarea
				v-model={current.value}
				maxlength={2}
				bytes
				indicator
			/>
		));

		expect(wrapper.html()).toMatch('2/2');
	});

	it('indicator:inline & indicateClass', async () => {
		const wrapper = mount(() => (
			<Textarea
				maxlength={10}
				indicateClass="custom-indicator"
				indicator={{ inline: true }}
			/>
		));

		const indicator = wrapper.find('.vc-textarea__indicator');
		expect(indicator.exists()).toBe(true);
		expect(indicator.classes()).toContain('is-inline');
		expect(indicator.classes()).toContain('custom-indicator');
	});

	it('no indicator', async () => {
		const wrapper = mount(() => <Textarea maxlength={10} />);
		expect(wrapper.find('.vc-textarea__indicator').exists()).toBe(false);
	});

	it('maxlength', async () => {
		const wrapper = mount(Textarea, {
			props: {
				maxlength: 11,
				bytes: false,
				modelValue: ''
			}
		});

		const el = wrapper.find('textarea').element;
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

		const wrapper = mount(Textarea, {
			props: {
				'maxlength': 1,
				'modelValue': current.value,
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});
		const el = wrapper.find('textarea').element;
		expect(el.maxLength).toBe(1);

		el.value = 'abc';
		await wrapper.find('textarea').trigger('input', {
			inputType: 'deleteContentBackward'
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

		const wrapper = mount(() => (
			<Textarea
				maxlength={2}
				bytes={true}
				modelValue={current.value}
				onInput={handleInput}
				onUpdate:modelValue={handleUpdateModelValue}
			/>
		));
		const el = wrapper.find('textarea').element;
		expect(el.maxLength).toBe(2);

		await wrapper.find('textarea').setValue('abcdf');
		expect(current.value).toBe('abcd');
		expect(handleInput).toBeCalledTimes(1);

		await wrapper.find('textarea').setValue('测试s');
		expect(current.value).toBe('测试');
		expect(handleInput).toBeCalledTimes(2);
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
		const wrapper = mount(Textarea, {
			attrs: {
				placeholder
			},
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
				'onUpdate:modelValue': handleUpdateModelValue
			}
		});

		const el = wrapper.find('textarea').element;
		expect(el.placeholder).toBe(placeholder);
		expect(el.value).toBe(current.value);

		await wrapper.find('textarea').trigger('focus');
		expect(handleFocus).toHaveBeenCalledTimes(1);

		await wrapper.find('textarea').setValue('any1');
		expect(handleUpdateModelValue).toHaveBeenCalledTimes(1);
		expect(handleInput).toHaveBeenCalledTimes(1);
		expect(handleChange).toHaveBeenCalled();
		expect(current.value).toBe('any1');

		await wrapper.find('textarea').trigger('blur');
		expect(handleBlur).toHaveBeenCalledTimes(1);

		await wrapper.find('textarea').trigger('keydown');
		expect(handleKeydown).toHaveBeenCalledTimes(1);

		await wrapper.find('textarea').trigger('keypress');
		expect(handleKeypress).toHaveBeenCalledTimes(1);

		await wrapper.find('textarea').trigger('keyup');
		expect(handleKeyup).toHaveBeenCalledTimes(1);
		expect(handleEnter).toHaveBeenCalledTimes(0);

		await wrapper.find('textarea').trigger('keyup', { keyCode: 13 });
		expect(handleKeyup).toHaveBeenCalledTimes(2);
		expect(handleEnter).toHaveBeenCalledTimes(1);

		await wrapper.find('textarea').trigger('paste', { clipboardData: { getData: () => '2' } });
		expect(handlePaste).toHaveBeenCalledTimes(1);
	});

	it('event:composition', async () => {
		const handleInput = vi.fn();
		const current = ref('');

		const wrapper = mount(Textarea, {
			props: {
				modelValue: current.value,
				onInput: handleInput
			}
		});

		await wrapper.find('textarea').trigger('compositionstart');
		wrapper.find('textarea').element.value = '1';
		await wrapper.find('textarea').trigger('input');
		wrapper.find('textarea').element.value = '2';
		await wrapper.find('textarea').trigger('compositionupdate');
		await wrapper.find('textarea').trigger('input');
		await wrapper.find('textarea').trigger('compositionend');
		expect(handleInput).toBeCalledTimes(1);
	});

	it('uncontrolled', async () => {
		const wrapper = mount(Textarea, {
			props: {
				controllable: false
			}
		});
		await wrapper.find('textarea').setValue('123');
		expect(wrapper.find('textarea').element.value).toBe('123');

		await wrapper.setProps({ modelValue: '123' });
		expect(wrapper.find('textarea').element.value).toBe('123');

		await wrapper.setProps({ modelValue: '12' });
		expect(wrapper.find('textarea').element.value).toBe('12');
	});

	it('controlled', async () => {
		const wrapper = mount(Textarea, {
			props: {
				controllable: true
			}
		});
		await wrapper.find('textarea').setValue('123');
		expect(wrapper.find('textarea').element.value).toBe('');

		await wrapper.setProps({ modelValue: '12' });
		expect(wrapper.find('textarea').element.value).toBe('12');
	});

	it('autosize & refresh', async () => {
		const wrapper = mount(Textarea, {
			props: {
				modelValue: '',
				autosize: { minRows: 2, maxRows: 4 },
				textareaStyle: { boxSizing: 'border-box' }
			}
		});
		const vm = wrapper.vm as any;

		await wrapper.setProps({ modelValue: 'line1\nline2\nline3' });
		await nextTick();
		await nextTick();

		expect(() => vm.refresh()).not.toThrow();
	});

	it('autosize:content-box', async () => {
		const wrapper = mount(Textarea, {
			props: {
				modelValue: 'content',
				autosize: { minRows: 2, maxRows: 4 },
				textareaStyle: { boxSizing: 'content-box' }
			}
		});
		await nextTick();
		await nextTick();
		expect(wrapper.find('textarea').exists()).toBe(true);
	});

	it('autosize:true without maxRows', async () => {
		const wrapper = mount(Textarea, {
			props: {
				modelValue: 'content',
				autosize: true
			}
		});
		await nextTick();
		await nextTick();

		// autosize=true 时无 min/max，走 overflowY = 'hidden' 分支
		await wrapper.setProps({ modelValue: 'a\nb\nc\nd' });
		await nextTick();
		await nextTick();
		expect(wrapper.find('textarea').exists()).toBe(true);
	});

	it('sync: same value no re-emit', async () => {
		const handleInput = vi.fn();
		const wrapper = mount(Textarea, {
			props: {
				modelValue: 'same',
				onInput: handleInput
			}
		});

		const el = wrapper.find('textarea').element;
		el.value = 'same';
		await wrapper.find('textarea').trigger('input');

		expect(handleInput).toHaveBeenCalledTimes(0);
	});

	it('bytes: value not truncated', async () => {
		const current = ref('');
		const handleInput = vi.fn();
		const wrapper = mount(() => (
			<Textarea
				modelValue={current.value}
				maxlength={10}
				bytes
				indicator
				onInput={handleInput}
			/>
		));

		// 空值时 getBytesSize 为 0，覆盖 indicator 中 `|| 0` 分支
		expect(wrapper.html()).toMatch('0/10');

		// 值未超过 maxlength，fitValue === value，覆盖不截断分支
		await wrapper.find('textarea').setValue('ab');
		expect(handleInput).toHaveBeenCalledTimes(1);
	});

	it('event:resize & unmount', async () => {
		// Resize 依赖 ResizeObserver，jsdom 下 mock 掉并捕获回调，手动触发 handleResize。
		const resizeHandlers: Array<(...args: any[]) => any> = [];
		const onSpy = vi.spyOn(Resize, 'on').mockImplementation((_el: any, fn: any) => {
			resizeHandlers.push(fn);
			return () => {};
		});
		const offSpy = vi.spyOn(Resize, 'off').mockImplementation(() => {});

		const handleResize = vi.fn();
		const wrapper = mount(Textarea, {
			props: {
				onResize: handleResize
			}
		});

		expect(onSpy).toHaveBeenCalledTimes(1);
		expect(resizeHandlers.length).toBe(1);

		resizeHandlers[0](new Event('resize'));
		expect(handleResize).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		expect(offSpy).toHaveBeenCalledTimes(1);

		onSpy.mockRestore();
		offSpy.mockRestore();
	});
});
