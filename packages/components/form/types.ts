// @file 含该组件内所有类型定义

import type { ComponentInternalInstance, ComputedRef, Ref, UnwrapRef } from 'vue';
import type { Props as FormProps } from './form-props';

export interface FormRule {
	[key: string]: any;
	trigger: string | string[];
	required: boolean | ((...args: any[]) => any);
	message?: string;
}

export interface FormError {
	[key: string]: any;
	prop?: string;
	message?: string;
}

// form-item.props
export interface FormItemProps {
	label: string;
	labelWidth: number;
	prop: string;
	required: boolean;
	error: string;
	rules: FormRule[];
	showMessage: boolean;
	labelFor: string;
}

// use-form-item.ts
export interface FormItemData {
	isRequired: Ref<boolean>;
	validateState: Ref<string>;
	validateMessage: Ref<string>;
	validateDisabled: Ref<boolean>;
	validator: Ref<{}>;
	classes: ComputedRef<{}>;
	labelStyle: ComputedRef<{}>;
	contentStyle: ComputedRef<{}>;
	fieldValue: ComputedRef<any>;
	showError: ComputedRef<boolean>;
	validate: (...args: any[]) => any;
	resetField: (...args: any[]) => any;
}

interface OverwriteFormItem {
	props: FormItemProps;
	proxy: UnwrapRef<FormItemData>
}

export type FormItemInstance = OverwriteFormItem & ComponentInternalInstance;

// use-form.ts
export interface FormData {
	getField: (...args: any[]) => any;
	resetField: (...args: any[]) => any;
	valideate: (...args: any[]) => any;
}

export interface FormOptions {
	throwToast?: (...args: any[]) => any;
}

export interface FormValidateOptions {
	scroll?: boolean;
}

export interface FormValidateResponse {
	message?: string;
}


interface OverwriteForm {
	props: FormProps;
	proxy: UnwrapRef<FormData>;
}

export type FormInstance = OverwriteForm & ComponentInternalInstance

export interface FormItemInject {
	blur: (...args: any[]) => void;
	change: (...args: any[]) => void;
}

export interface FormInject {
	props: FormProps;
	add: (instance: ComponentInternalInstance) => void;
	remove: (instance: ComponentInternalInstance) => void;
}

