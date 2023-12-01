// @vitest-environment jsdom
import { ref } from 'vue';
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

	it('default: invalid value', async () => {
		const wrapper = mount(InputNumber, {
			props: {
				modelValue: 'any'
			}
		});

		expect(wrapper.find('input').element.value).toBe('any');
	});

	it('min:blur', async () => {
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
		const wrapper = mount(() => (
			<InputNumber 
				v-model={current.value}
			/>
		));

		await wrapper.trigger('blur');
	});
});
