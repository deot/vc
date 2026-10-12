import type { ComponentInternalInstance } from 'vue';
import type { Language } from '@deot/vc-locale';
import { zhCN } from '@deot/vc-locale';
import { VARIABLES } from '../theme/constant';
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
}>;

export type ResolvedOptions = Options & {
	locale: Language;
};

/**
 * 组件的配置项
 */
export const defaults: ResolvedOptions = {
	locale: zhCN,
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
		enhancer: nil
	},
	Tour: {
		cache: true,
		cacheTypes: ['finish', 'skip'],
		getCache: nil,
		setCache: nil,
		onOpen: nil
	},
};
