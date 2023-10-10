import { VARIABLES } from '../theme/constant';
/**
 * 组件的配置项
 */
export const defaults = {
	Theme: {
		variables: VARIABLES
	}
};

export type Options = typeof defaults & { [key: string]: any };
