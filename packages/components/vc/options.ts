import type { ComponentInternalInstance } from 'vue';
import { VARIABLES } from '../theme/constant';

const nil = void 0;

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
	UploadPicker: {
		enhancer: nil
	},
	Editor: {
		options: nil,
		enhancer: nil
	},
	Theme: {
		variables: VARIABLES
	},
	Portal: {
		install: nil
	},
	Upload: {
		onRequest: nil,
		onResponse: nil,
		onMessage: nil
	},
	TableColumn: {
		line: nil
	}
};
