// @vitest-environment jsdom

import { reactive, ref } from 'vue';
import { Form, FormItem, MForm, MFormItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Input } from './fixtures/input';
import { Select } from './fixtures/select';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Form).toBe('object');
		expect(typeof FormItem).toBe('object');
	});
	it('create', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem>
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem>
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));
		await form.value.validate();
		expect(wrapper.classes()).toContain('vc-form');
		expect(wrapper.find('.vc-form-item').exists()).toBeTruthy();
	});

	it('styleless', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const wrapper = mount(() => (
			<Form ref={form} model={formData} styleless={true}>
				<FormItem>
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem>
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));
		await form.value.validate();
		expect(wrapper.classes()).toContain('vc-form');
		expect(wrapper.find('.vc-form-item').exists()).toBeFalsy();
	});

	it('styleless, m-form', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const wrapper = mount(() => (
			<MForm ref={form} model={formData} styleless={true}>
				<MFormItem>
					<Input v-model={formData.input} />
				</MFormItem>
				<MFormItem>
					<Select v-model={formData.select} />
				</MFormItem>
			</MForm>
		));
		await form.value.validate();
		expect(wrapper.classes()).toContain('vcm-form');
		expect(wrapper.find('.vcm-form-item').exists()).toBeFalsy();
	});

	it('create, m-form', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const wrapper = mount(() => (
			<MForm ref={form} model={formData}>
				<MFormItem>
					<Input v-model={formData.input} />
				</MFormItem>
				<MFormItem>
					<Select v-model={formData.select} />
				</MFormItem>
			</MForm>
		));
		await form.value.validate();
		expect(wrapper.classes()).toContain('vcm-form');
		expect(wrapper.find('.vcm-form-item').exists()).toBeTruthy();
	});

	it('failed', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});

		const formRules = reactive({
			input: {
				trigger: 'change',
				required: true,
				message: 'input必填'
			},
			select: {
				trigger: 'change',
				required: true,
				message: 'select必填'
			}
		});

		mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem prop="select">
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));
		await form.value.validate().catch((errors: any) => {
			expect(errors[0]).toEqual({ prop: 'input', message: formRules.input.message });
			expect(errors[1]).toEqual({ prop: 'select', message: formRules.select.message });
		});
	});

	it('pass', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});

		const formRules = reactive({
			input: {
				trigger: 'change',
				required: true,
				message: 'input必填'
			},
			select: {
				trigger: 'change',
				required: true,
				message: 'select必填'
			}
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem prop="select">
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));

		await wrapper.find('input').setValue('1');
		await wrapper.find('.a').trigger('click');
		await form.value.validate();

		expect(formData.input).toBe('1');
		expect(formData.select).toEqual(['a']);
	});
});
