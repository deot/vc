import { provide, getCurrentInstance } from 'vue';
import type { VNode, SetupContext, ComponentInternalInstance } from 'vue';
import { getPropByPath } from '@deot/helper-utils';
import { VcError } from '../vc/index';
import type { FormProvide } from './types';
import type { Props } from './form-props';

interface FormOptions {
	throwToast?: (...args: any[]) => any;
}

interface FormFieldsOptions {
	fields?: string[];
	excludeFields?: string[];
}

interface FormValidateOptions extends FormFieldsOptions {
	scroll?: boolean;
}

interface FormResetOptions extends FormFieldsOptions {
	original?: object;
}

export const useForm = (expose: SetupContext['expose'], options: FormOptions = {}) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;

	const fields: ComponentInternalInstance[] = [];

	provide<FormProvide>('vc-form', {
		props,
		add: (field) => {
			field && fields.push(field);
		},
		remove: (field) => {
			// 未设置prop的表单项不会注册，indexOf为-1时不能splice
			const index = fields.indexOf(field);
			index !== -1 && fields.splice(index, 1);
		}
	});

	// 先按fields选择（未传则为全部），再排除excludeFields
	const filterFields = ({ fields: fields$, excludeFields }: FormFieldsOptions = {}) => {
		return fields.filter((item) => {
			const prop = item.props.prop as string;
			return (!fields$ || fields$.includes(prop)) && !excludeFields?.includes(prop);
		});
	};

	const getField = (prop: string) => {
		const field = fields.find(item => item.props.prop === prop);
		if (!field) throw new VcError('form', '请选择有用的prop值');

		return field;
	};

	const showToast = (msg: string) => {
		props.showMessage && options.throwToast?.(msg);
	};

	const sortErrors = async (errors: any[]) => {
		const positions = await Promise.all(fields.map(item => (item.exposed as any).getPosition()));
		try {
			return [...errors].toSorted((a, b) => {
				const aIndex = fields.findIndex(i => i.props.prop === a.prop);
				const bIndex = fields.findIndex(i => i.props.prop === b.prop);

				const aPosition = positions[aIndex];
				const bPosition = positions[bIndex];

				if (aPosition.top != bPosition.top) return aPosition.top - bPosition.top;
				return aPosition.left - bPosition.left;
			});
		} catch {
			return errors;
		}
	};

	const scrollIntoView = (prop: string) => {
		const field = getField(prop);
		(field.vnode as VNode)?.el?.scrollIntoView?.({
			behavior: 'smooth',
			block: 'center',
		});
	};

	const reset = (options$: FormResetOptions = {}) => {
		const { fields: fields$, excludeFields, original = {} } = options$;
		filterFields({ fields: fields$, excludeFields }).forEach((field) => {
			let v: any;

			try {
				v = getPropByPath(original, field.props.prop as string).v;
			} catch { /* empty */ }

			(field.exposed as any).reset(v);
		});
	};

	const clear = (options$: FormFieldsOptions = {}) => {
		filterFields(options$).forEach(field => (field.exposed as any).clear());
	};

	const validate = async (options$: FormValidateOptions = {}) => {
		const { scroll = true, fields: fields$, excludeFields } = options$;

		if (!fields.length) {
			return;
		}

		const results = await Promise.allSettled(
			filterFields({ fields: fields$, excludeFields }).map(item => (item.exposed as any).validate(''))
		);

		const originErrors = results
			.filter(i => i.status === 'rejected')
			.map(i => (i as PromiseRejectedResult).reason);

		if (!originErrors.length) return;

		const errors = await sortErrors(originErrors);
		// 全部校验完成
		showToast(errors[0].msg || errors[0].message);

		scroll && scrollIntoView(errors[0].prop);

		throw errors;
	};

	const validateField = async (prop: string, options$: Pick<FormValidateOptions, 'scroll'> = {}) => {
		try {
			await validate({
				scroll: options$.scroll,
				fields: [prop]
			});
		} catch (e) {
			throw e![0];
		}
	};

	expose({
		reset,
		clear,
		validate,

		// 单个操作
		getField,
		validateField
	});
};
