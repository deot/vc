// @vitest-environment jsdom

import { nextTick, reactive, ref } from 'vue';
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

	it('validate, empty fields', async () => {
		expect.hasAssertions();
		const form = ref();
		mount(() => (
			<Form ref={form} model={{}} />
		));

		// 没有 field 时直接返回 undefined
		await expect(form.value.validate()).resolves.toBeUndefined();
	});

	it('validate, fields option', async () => {
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

		// 只校验 input
		let errors: any;
		await form.value.validate({ fields: ['input'], scroll: false }).catch((e: any) => {
			errors = e;
		});
		expect(errors).toHaveLength(1);
		expect(errors[0]).toEqual({ prop: 'input', message: formRules.input.message });
	});

	it('validateField', async () => {
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
			}
		});

		mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		// 校验失败，抛出单个错误对象
		let error: any;
		await form.value.validateField('input', { scroll: false }).catch((e: any) => {
			error = e;
		});
		expect(error).toEqual({ prop: 'input', message: formRules.input.message });

		// 修改后校验通过
		formData.input = '1';
		await expect(form.value.validateField('input', { scroll: false })).resolves.toBeUndefined();
	});

	it('getField', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		await nextTick();
		expect(form.value.getField('input').props.prop).toBe('input');
		// 无效 prop 抛出错误
		expect(() => form.value.getField('unknown')).toThrow();
	});

	it('reset', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
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
		expect(formData.input).toBe('1');
		expect(formData.select).toEqual(['a']);

		// 重置回初始值
		form.value.reset();
		await nextTick();
		expect(formData.input).toBe('');
		expect(formData.select).toEqual([]);
	});

	it('reset, original & fields', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			other: ''
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem prop="other">
					<Input v-model={formData.other} />
				</FormItem>
			</Form>
		));

		const inputs = wrapper.findAll('input');
		await inputs[0].setValue('1');
		await inputs[1].setValue('2');

		// 只重置 input，且重置为指定的 original 值
		form.value.reset({ fields: ['input'], original: { input: 'reset-value' } });
		await nextTick();
		expect(formData.input).toBe('reset-value');
		expect(formData.other).toBe('2');
	});

	it('validate, excludeFields option', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const formRules = reactive({
			input: {
				required: true,
				message: 'input必填'
			},
			select: {
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

		// 跳过 select
		let errors: any;
		await form.value.validate({ excludeFields: ['select'], scroll: false }).catch((e: any) => {
			errors = e;
		});
		expect(errors).toEqual([{ prop: 'input', message: formRules.input.message }]);

		const items = wrapper.findAll('.vc-form-item');
		expect(items[0].classes()).toContain('is-error');
		expect(items[1].classes()).not.toContain('is-error');

		// 全部排除时直接通过
		await expect(form.value.validate({ excludeFields: ['input', 'select'], scroll: false })).resolves.toBeUndefined();
	});

	it('validate, fields & excludeFields', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			other: '',
			select: []
		});
		const formRules = reactive({
			input: { required: true, message: 'input必填' },
			other: { required: true, message: 'other必填' },
			select: { required: true, message: 'select必填' }
		});

		mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem prop="other">
					<Input v-model={formData.other} />
				</FormItem>
				<FormItem prop="select">
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));

		// 先按 fields 选择，再排除 excludeFields
		let errors: any;
		await form.value.validate({
			fields: ['input', 'other'],
			excludeFields: ['input'],
			scroll: false
		}).catch((e: any) => {
			errors = e;
		});
		expect(errors).toEqual([{ prop: 'other', message: formRules.other.message }]);
	});

	it('clear', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			select: []
		});
		const formRules = reactive({
			input: {
				required: true,
				message: 'input必填'
			},
			select: {
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

		const items = () => wrapper.findAll('.vc-form-item');

		await form.value.validate({ scroll: false }).catch(() => {});
		await nextTick();
		expect(items()[0].classes()).toContain('is-error');
		expect(items()[1].classes()).toContain('is-error');

		// 只清除 input
		form.value.clear({ fields: ['input'] });
		await nextTick();
		expect(items()[0].classes()).not.toContain('is-error');
		expect(items()[0].find('.vc-form-item__tip').isVisible()).toBe(false);
		expect(items()[1].classes()).toContain('is-error');

		// 清除除 input 外的字段
		await form.value.validate({ scroll: false }).catch(() => {});
		await nextTick();
		form.value.clear({ excludeFields: ['input'] });
		await nextTick();
		expect(items()[0].classes()).toContain('is-error');
		expect(items()[1].classes()).not.toContain('is-error');

		// 全部清除，不改变值
		form.value.clear();
		await nextTick();
		expect(wrapper.findAll('.vc-form-item.is-error')).toHaveLength(0);
		expect(formData.input).toBe('');
		expect(formData.select).toEqual([]);
	});

	it('clear, keep value', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });
		const formRules = reactive({
			input: {
				validate: (v: string) => v.length >= 3 || '至少3个字符'
			}
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		await wrapper.find('input').setValue('1');
		await form.value.validate({ scroll: false }).catch(() => {});
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).toContain('is-error');

		// 单个 form-item 清除
		form.value.getField('input').exposed.clear();
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).not.toContain('is-error');
		expect(formData.input).toBe('1');
	});

	it('clear, during validating', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });
		const formRules = reactive({
			input: { required: true, message: 'input必填' }
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		// 校验尚未完成时清除，结果照常返回，但不再显示错误
		const validating = form.value.validate({ scroll: false });
		form.value.clear();
		await expect(validating).rejects.toEqual([{ prop: 'input', message: 'input必填' }]);
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).not.toContain('is-error');

		// clear 之后发起的校验正常显示
		await form.value.validate({ scroll: false }).catch(() => {});
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).toContain('is-error');
	});

	it('reset, excludeFields', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({
			input: '',
			other: ''
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				<FormItem prop="other">
					<Input v-model={formData.other} />
				</FormItem>
			</Form>
		));

		const inputs = wrapper.findAll('input');
		await inputs[0].setValue('1');
		await inputs[1].setValue('2');

		form.value.reset({ excludeFields: ['other'] });
		await nextTick();
		expect(formData.input).toBe('');
		expect(formData.other).toBe('2');
	});

	it('reset, initial value undefined', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive<{ select?: string[] }>({});

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="select">
					<Select v-model={formData.select} />
				</FormItem>
			</Form>
		));

		await wrapper.find('.a').trigger('click');
		expect(formData.select).toEqual(['a']);

		// 恢复为 undefined，而不是 [undefined]
		form.value.reset();
		await nextTick();
		expect(formData.select).toBeUndefined();
	});

	it('unmount form-item without prop, keep registered fields', async () => {
		expect.hasAssertions();
		const form = ref();
		const show = ref(true);
		const formData = reactive({ input: '' });
		const formRules = reactive({
			input: { required: true, message: 'input必填' }
		});

		mount(() => (
			<Form ref={form} model={formData} rules={formRules}>
				<FormItem prop="input">
					<Input v-model={formData.input} />
				</FormItem>
				{ show.value && <FormItem label="无prop" /> }
			</Form>
		));

		show.value = false;
		await nextTick();

		// 没有 prop 的项卸载时，不能误删已注册的字段
		expect(form.value.getField('input').props.prop).toBe('input');
		await expect(form.value.validate({ scroll: false })).rejects.toHaveLength(1);
	});

	it('label & required & asterisk', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" label="用户名" required={true}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		const item = wrapper.find('.vc-form-item');
		expect(item.find('.vc-form-item__label').text()).toBe('用户名');
		expect(item.classes()).toContain('is-required');
		expect(item.classes()).toContain('is-right');
	});

	it('label slot', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" v-slots={{ label: () => <span class="custom-label">自定义</span> }}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		expect(wrapper.find('.custom-label').text()).toBe('自定义');
	});

	it('asterisk=false, no is-required', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" label="用户名" required={true} asterisk={false}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		expect(wrapper.find('.vc-form-item').classes()).not.toContain('is-required');
	});

	it('inline & labelPosition', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData} inline={true} labelPosition="top">
				<FormItem prop="input" label="用户名">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		const item = wrapper.find('.vc-form-item');
		expect(item.classes()).toContain('is-inline');
		expect(item.classes()).toContain('is-top');
	});

	it('error prop', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });
		const error = ref('');

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" error={error.value}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		expect(wrapper.find('.vc-form-item').classes()).not.toContain('is-error');

		error.value = '出错了';
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).toContain('is-error');
		expect(wrapper.find('.vc-form-item__tip').text()).toBe('出错了');

		// 置空清除错误
		error.value = '';
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).not.toContain('is-error');
	});

	it('rules on form-item', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" rules={{ required: true, message: 'form-item必填' }}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		let errors: any;
		await form.value.validate({ scroll: false }).catch((e: any) => {
			errors = e;
		});
		expect(errors[0]).toEqual({ prop: 'input', message: 'form-item必填' });
	});

	it('required as string message', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" required="不能为空">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		let errors: any;
		await form.value.validate({ scroll: false }).catch((e: any) => {
			errors = e;
		});
		expect(errors[0]).toEqual({ prop: 'input', message: '不能为空' });
	});

	it('showMessage=false, is-alone & hide tip', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" required={true} showMessage={false}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		expect(wrapper.find('.vc-form-item').classes()).toContain('is-alone');

		await form.value.validate({ scroll: false }).catch(() => { /* empty */ });
		await nextTick();
		// showMessage=false 时不显示提示信息
		const tip = wrapper.find('.vc-form-item__tip');
		if (tip.exists()) {
			expect(tip.attributes('style')).toContain('display: none');
		}
	});

	it('blur trigger validate', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="input" rules={{ trigger: 'blur', required: true, message: 'blur必填' }}>
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		await wrapper.find('input').trigger('blur');
		// blur 校验是异步的（内部 await nextTick + 异步校验），需等待微任务队列清空
		await new Promise(resolve => setTimeout(resolve));
		await nextTick();
		expect(wrapper.find('.vc-form-item').classes()).toContain('is-error');
		expect(wrapper.find('.vc-form-item__tip').text()).toBe('blur必填');
	});

	it('nested form-item', () => {
		const form = ref();
		const formData = reactive({
			nest: {
				value: '',
				value1: ''
			}
		});

		const wrapper = mount(() => (
			<Form ref={form} model={formData}>
				<FormItem prop="nest.value" label="外层">
					<Input v-model={formData.nest.value} />
					<FormItem prop="nest.value1" label="内层">
						<Input v-model={formData.nest.value1} />
					</FormItem>
				</FormItem>
			</Form>
		));

		const items = wrapper.findAll('.vc-form-item');
		expect(items).toHaveLength(2);
		// 内层是嵌套的
		expect(items[1].classes()).toContain('is-nested');
		expect(items[0].classes()).not.toContain('is-nested');
	});

	it('form-item outside form throws', () => {
		expect.hasAssertions();
		expect(() => mount(() => (
			<FormItem prop="input">
				<Input />
			</FormItem>
		))).toThrow();
	});

	it('inject class/style from form', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<Form ref={form} model={formData} contentClass="from-form-content" labelClass="from-form-label">
				<FormItem prop="input" label="用户名">
					<Input v-model={formData.input} />
				</FormItem>
			</Form>
		));

		expect(wrapper.find('.vc-form-item__content').classes()).toContain('from-form-content');
		expect(wrapper.find('.vc-form-item__label').classes()).toContain('from-form-label');
	});

	it('m-form, label & indent', () => {
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<MForm ref={form} model={formData}>
				<MFormItem prop="input" label="移动端" indent={20}>
					<Input v-model={formData.input} />
				</MFormItem>
			</MForm>
		));

		expect(wrapper.find('.vcm-form-item__label').text()).toBe('移动端');
		expect(wrapper.find('.vcm-form-item').attributes('style')).toContain('padding-left: 20px');
	});

	it('m-form, failed & showMessage', async () => {
		expect.hasAssertions();
		const form = ref();
		const formData = reactive({ input: '' });

		const wrapper = mount(() => (
			<MForm ref={form} model={formData}>
				<MFormItem prop="input" required="移动端必填">
					<Input v-model={formData.input} />
				</MFormItem>
			</MForm>
		));

		let errors: any;
		await form.value.validate({ scroll: false }).catch((e: any) => {
			errors = e;
		});
		await nextTick();
		expect(errors[0]).toEqual({ prop: 'input', message: '移动端必填' });
		expect(wrapper.find('.vcm-form-item__error').text()).toBe('移动端必填');
	});
});
