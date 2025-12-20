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
	Editor: {
		options: nil,
		enhancer: nil
	},
	Portal: {
		install: nil
	},
	RecycleList: {
		renderRefresh: nil,
		renderPlaceholder: nil,
		renderLoading: nil,
		renderComplete: nil,
		renderEmpty: nil
	},
	Snapshot: {
		options: nil,
		source: nil,
		download: nil
	},
	TableColumn: {
		line: nil
	},
	Theme: {
		variables: VARIABLES
	},
	Upload: {
		onRequest: nil,
		onResponse: nil,
		onMessage: nil
	},
	UploadPicker: {
		enhancer: nil
	},
};
