import { provide, getCurrentInstance } from 'vue';
import type { VNode, SetupContext } from 'vue';
import { sortBy } from 'lodash';
import { VcError } from '../vc/index';
import type { 
	FormInject, 
	FormInstance, 
	FormItemInstance, 
	FormOptions, 
	FormValidateOptions 
} from './types';

export const useForm = (expose: SetupContext['expose'], options: FormOptions = {}) => {
	const instance = getCurrentInstance() as FormInstance;
	const { slots, props } = instance;

	const fields: FormItemInstance[] = [];

	provide('form', {
		props,
		add: (item: FormItemInstance) => {
			item && fields.push(item);
		},
		remove: (item: FormItemInstance) => {
			item.props.prop && fields.splice(fields.indexOf(item), 1);
		}
	} as FormInject);

	const resetFields = () => {
		fields.forEach(item => (item.exposed as any).resetField());
	};

	const getField = (prop: string) => {
		const field = fields.find(item => item.props.prop === prop);
		if (!field) throw new VcError('form', '请选择有用的prop值');

		return field;
	};

	const showToast = (msg: string) => {
		props.showMessage 
			&& options.throwToast 
			&& options.throwToast(msg);
	};

	// 同时处理嵌套form-item
	// TODO: 渲染时计算（使用[form]vnode.el和[formItem]vnode.el）
	const sortErrors = (errors: any[]) => {
		let basicSort = {};
		let count = 0;

		let fn = (vnodes: VNode[]) => {
			vnodes.forEach((vnode: VNode) => {
				try {
					let { prop } = vnode.props || {}; 
					let { children } = vnode;

					if (
						prop
						&& typeof vnode.type === 'object' 
						&& (vnode.type as any).name 
						&& /^vcm?-form-item$/.test((vnode.type as any).name)
					) {
						basicSort[prop] = count++;
					} else if (children && typeof (children as any).default === 'function') {
						// 如果children中含 vc-table 且使用了#default="{ row }"，目前暂时先屏蔽报错
						try {
							fn((children as any).default({ row: {}, $index: -1 }));
						} catch {
							// any	
						}
					} else if (children && children instanceof Array) {
						fn(children as VNode[]);
					}
				} catch (e) {
					throw new VcError('form', e);
				}
			});
		};

		fn(slots.default?.() as VNode[]);
		errors = sortBy(errors, [(i: any) => basicSort[i.prop]]);
		return errors;
	};

	const scrollIntoView = (prop: string) => {
		let field = getField(prop);
		(field.vnode as VNode)?.el?.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	};

	const validate = async (options$: FormValidateOptions = {}) => {
		const { scroll = true } = options$;

		if (!fields.length) {
			return;
		}

		let results = await Promise.allSettled(
			fields.map(item => (item.exposed as any).validate(''))
		);

		let originErrors = results.filter(i => i.status === 'rejected').map(i => (i as PromiseRejectedResult).reason);

		if (!originErrors.length) return;

		let errors = sortErrors(originErrors);

		// 全部校验完成
		showToast(errors[0].msg || errors[0].message);

		scroll && scrollIntoView(errors[0].prop);

		throw errors;
	};

	const validateField = async (prop: string, options$: FormValidateOptions = {}) => {
		const { scroll = true } = options$;

		let field = getField(prop);
		try {
			(field.exposed as any).validate('');
		} catch (e: any) {
			let errorMsg = e.message;
			showToast(errorMsg);
			scroll && scrollIntoView(prop);

			throw e;
		}
	};

	const exposed = {
		getField,
		resetFields,
		validate,
		validateField
	};
	expose(exposed);
	
	return exposed;
};