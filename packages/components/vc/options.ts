import type { App, ComponentInternalInstance } from 'vue';
import type { Language } from '@deot/vc-locale';
import { zhCN } from '@deot/vc-locale';
import { VARIABLES } from '../theme/constant';
import type { CustomerData, CustomerRender } from '../customer/types';
import type { FilePreviewOptions } from '../file-preview/types';
import type { ImageFormatter } from '../image/image-props';
import type { SnapshotDownload } from '../snapshot/snapshot-props';
import type { TourConfig } from '../tour/types';
import type { UploadCallback, UploadEnhancer } from '../upload/types';
import type { PickerEnhancer } from '../upload-picker/types';

const nil = void 0;

export type Options = Partial<{
	[key: string]: any;
	locale: Language;
	// 写入 HTML 前的清洗：库内所有按 HTML 渲染的内容都会经过；instance.parent 是使用它的组件
	sanitize: (data: { value: string; instance: ComponentInternalInstance }) => string;
	Theme: {
		variables: Record<string, string>;
	};
	MListItem: {
		to: (data: { value: any; instance: ComponentInternalInstance }) => any;
	};
	Image: {
		formatter?: ImageFormatter;
	};
	FilePreview: FilePreviewOptions;
	Tour: TourConfig;
	Portal: {
		[key: string]: any;
		// 弹层挂载成独立应用时调用，用来注册全局插件
		install?: (app: App) => any;
	};
	RecycleList: Partial<Record<'renderRefresh' | 'renderPlaceholder' | 'renderLoading' | 'renderComplete' | 'renderEmpty', CustomerRender>>;
	TableColumn: {
		line?: number;
		headerLine?: number;
	};
	Snapshot: {
		options?: Record<string, any>;
		source?: any;
		download?: SnapshotDownload;
	};
	Upload: Partial<Pick<UploadCallback, 'onRequest' | 'onResponse' | 'onMessage'>> & {
		name?: string;
		enhancer?: UploadEnhancer;
	};
	UploadPicker: {
		enhancer?: PickerEnhancer;
	};
	Editor: {
		options?: Record<string, any>;
		enhancer?: PickerEnhancer;
	};
	Customer: {
		// 渲染前转换 { type, value } 的内容，用于扩展自定义类型；字符串不经过它
		formatter?: (data: CustomerData & { instance: ComponentInternalInstance }) => any;
	};
}>;

export type ResolvedOptions = Options & {
	locale: Language;
};

/**
 * 组件的配置项
 */
export const defaults: ResolvedOptions = {
	locale: zhCN,
	sanitize: nil,
	Customer: {
		formatter: nil
	},
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
		line: nil,
		headerLine: nil
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
	Image: {
		formatter: nil
	},
	FilePreview: {
		getFileType: nil,
		getFileName: nil,
		enhancer: nil,
		renderSlide: nil,
		imageOptions: {
			fit: 'max-edge',
			max: 10,
			min: 1
		}
	},
	Tour: {
		cache: true,
		cacheTypes: ['finish', 'skip'],
		getCache: nil,
		setCache: nil,
		onOpen: nil
	},
};
