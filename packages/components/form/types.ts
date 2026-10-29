import type { ComponentInternalInstance, UnwrapNestedRefs, Ref } from 'vue';
import type { ValidatorRule } from '@deot/helper-validator';
import type { Props } from './form-props';

export interface FormProvide {
	props: Props;
	add: (item: ComponentInternalInstance) => any;
	remove: (item: ComponentInternalInstance) => any;
	// labelWidth为auto时各项标签的最大自然宽度
	labelWidth: Ref<number>;
	// 记录（width为空时移除）某一项标签的自然宽度
	setLabelWidth: (uid: number, width?: number) => void;
}

export interface FormItemProvide {
	blur: (...args: any[]) => any;
	change: (...args: any[]) => any;
	add: (item: ComponentInternalInstance) => any;
	remove: (item: ComponentInternalInstance) => any;
	fields: UnwrapNestedRefs<ComponentInternalInstance[]>;
	message: Ref<string>;
}

export type FormRule = ValidatorRule & {
	trigger?: string | string[];
};
