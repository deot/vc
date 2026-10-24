import type { ComponentInternalInstance } from 'vue';
import { Portal } from '../../portal';
import type { FilePreviewItem } from '../types';
import { resolveCurrent } from '../utils';
import { FileViewer } from './viewer';
import './style.scss';

export type ViewerOpenOptions = {
	data: FilePreviewItem[];
	current?: number;
	instance?: ComponentInternalInstance | null;
	triggerElement?: Element | null;
	onClose?: () => void;
};

const portal = new Portal(FileViewer, {
	multiple: true,
	leaveDelay: 0
});

export const openViewer = (options: ViewerOpenOptions) => {
	const { data, current, instance = null, triggerElement = null, onClose } = options;
	if (!data.length) return;
	return portal.popup({
		data,
		current: resolveCurrent(data, current),
		instance,
		triggerElement,
		onClose
	});
};
