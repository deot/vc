import { provide, getCurrentInstance } from 'vue';
import type { VNode, SetupContext, ComponentInternalInstance } from 'vue';
import { getPropByPath } from '@deot/helper-utils';
import { VcError } from '../vc/index';
import type { FormProvide } from './types';
import type { Props } from './form-props';

interface FormOptions {
	throwToast?: (...args: any[]) => any;
}

interface FormValidateOptions {
	scroll?: boolean;
	fields?: string[];
}

interface FormResetOptions {
	original?: object;
	fields?: string[];
}

export const useForm = (expose: SetupContext['expose'], options: FormOptions = {}) => {
	const instance = getCurrentInstance()!;
	const props = instance.props as Props;

	const fields: ComponentInternalInstance[] = [];

	provide<FormProvide>('form', {
		props,
		add: (field) => {
			field && fields.push(field);
		},
		remove: (field) => {
			field && fields.splice(fields.indexOf(field), 1);
		}
	});

	const filterFields = (fields$?: string[]) => {
		return !fields$ ? fields : fields.filter(item => fields$.includes(item.props.prop as string));
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
		} catch (e) {
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
		const { fields: fields$, original = {} } = options$;
		filterFields(fields$).forEach((field) => {
			let v: any;

			try {
				v = getPropByPath(original, field.props.prop as string).v;
			} catch (e) { /* empty */ }

			(field.exposed as any).reset(v);
		});
	};

	const validate = async (options$: FormValidateOptions = {}) => {
		const { scroll = true, fields: fields$ } = options$;

		if (!fields.length) {
			return;
		}

		const results = await Promise.allSettled(
			filterFields(fields$).map(item => (item.exposed as any).validate(''))
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

	const validateField = async (prop: string, options$: FormValidateOptions = {}) => {
		try {
			await validate({
				...options$,
				fields: [prop]
			});
		} catch (e) {
			throw e![0];
		}
	};

	expose({
		reset,
		validate,

		// 单个操作
		getField,
		validateField
	});
};
