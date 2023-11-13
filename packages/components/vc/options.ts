import type { ComponentInternalInstance } from 'vue';
import { VARIABLES } from '../theme/constant';

export type Defaults = Partial<{
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
export const defaults: Defaults = {
	Theme: {
		variables: VARIABLES
	}
};