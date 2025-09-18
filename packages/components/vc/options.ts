import type { ComponentInternalInstance } from 'vue';
import { VARIABLES } from '../theme/constant';

export type Options = Partial<{
	[key: string]: any;
	Theme: {
		variables: Record<string, string>;
	};
	MListItem: {
		to: (value: any, instance: ComponentInternalInstance) => any;
	};
}>;

/**
 * 组件的配置项
 */
export const defaults: Options = {
	Editor: {
		options: undefined
	},
	Theme: {
		variables: VARIABLES
	},
	Portal: {
		install: undefined
	},
	Upload: {
		onRequest: undefined,
		onResponse: undefined,
		onMessage: undefined
	},
	TableColumn: {
		line: undefined
	}
};
