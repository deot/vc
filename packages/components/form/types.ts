import type { ComponentInternalInstance } from 'vue';
import type { ValidatorRule } from '@deot/helper-validator';
import type { Props } from './form-props';

export interface FormProvide {
	props: Props;
	add: (item: ComponentInternalInstance) => any;
	remove: (item: ComponentInternalInstance) => any;
}

export interface FormItemProvide {
	blur: (...args: any[]) => any;
	change: (...args: any[]) => any;
}

export type FormRule = ValidatorRule & {
	trigger?: string | string[];
};
