// @vitest-environment jsdom
import { ref } from 'vue';
import { InputSearch, MInputSearch } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index-search.ts', () => {
	it('basic', () => {
		expect(typeof InputSearch).toBe('object');
		expect(typeof MInputSearch).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(InputSearch, {
			slots: {
				prepend: () => 'any'
			}
		});
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vc-input', 'vc-input-search']);
		await wrapper.find('input').trigger('focus');
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'vc-input-search']);
		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toEqual(['vc-input', 'is-focus', 'is-disabled', 'vc-input-search']);
		expect(wrapper.find('.vc-input__prepend').text()).toBe('any');
	});

	it('create, m-input-search', async () => {
		const wrapper = mount(MInputSearch, {
			slots: {
				prepend: () => 'any',
				append: () => 'any'
			}
		});
		const vm = wrapper.vm as any;

		expect(typeof vm.focus).toBe('function');
		expect(typeof vm.blur).toBe('function');
		expect(typeof vm.click).toBe('function');
		expect(wrapper.classes()).toEqual(['vcm-input-search']);

		let content = wrapper.find('.vcm-input-search__content');

		await wrapper.find('input').trigger('focus');
		expect(content.classes()).toEqual(['vcm-input', 'is-focus', 'vcm-input-search__content']);
		await wrapper.setProps({ disabled: true });
		expect(content.classes()).toEqual(['vcm-input', 'is-focus', 'is-disabled', 'vcm-input-search__content']);
		expect(content.find('.vcm-input__prepend').text()).toBe('any');
		expect(content.find('.vcm-input__append').text()).toBe('any');
	});

	it('event, m-input-search', async () => {
		const current = ref('123');
		const handleFocus = vi.fn();
		const handleBlur = vi.fn();
		const handleCancel = vi.fn();
		const wrapper = mount(() => {
			return (
				<MInputSearch 
					v-model={current.value}
					cancelText="any"
					// @ts-ignore
					onFocus={handleFocus}
					onBlur={handleBlur}
					onCancel={handleCancel} 
				/>
			);
		});
		expect(wrapper.find('input').element.value).toBe(current.value);
		await wrapper.find('input').trigger('focus');

		expect(handleFocus).toBeCalledTimes(1);

		const cancelBtn = wrapper.find('.vcm-input-search__btn');
		await cancelBtn.trigger('touchend');
		expect(cancelBtn.text()).toBe('any');
		expect(current.value).toBe('');
		expect(handleCancel).toBeCalledTimes(1);

		await wrapper.find('input').trigger('blur');
		expect(handleBlur).toBeCalledTimes(1);
		expect(wrapper.find('.vcm-input-search__btn').exists()).toBeFalsy();
	});

	it('enterText', async () => {
		const handleEnter = vi.fn();
		const wrapper = mount(InputSearch, {
			props: {
				enterText: '搜索',
				onEnter: handleEnter
			}
		});
		let el = wrapper.find('.vc-input-search__content');
		expect(el.text()).toBe('搜索');

		await el.trigger('click');
		expect(handleEnter).toBeCalledTimes(1);
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

		const wrapper = mount(InputSearch, {
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
});
