import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { VcInstance } from '../../vc'; // VcInstance.globalEvent.target
import { translate } from '../../locale';

type Options = {
	current?: number;
	data: any[];
	onClose?: any;
	// for photoswipe
	[key: string]: any;
};

const MAX_WIDTH = window.innerWidth;
const MAX_HEIGHT = window.innerHeight;

const getFitSize = (src: string) => {
	return new Promise((resolve) => {
		const img = new Image();
		let width;
		let height;
		img.onload = () => {
			const owidth = img.naturalWidth || img.width;
			const oheight = img.naturalHeight || img.height;
			if (owidth > oheight) {
				width = Math.min(MAX_WIDTH, owidth);
				height = width / owidth * oheight;
				resolve({
					width,
					height
				});
			} else {
				height = Math.min(MAX_HEIGHT, oheight);
				width = height / oheight * owidth;
				resolve({
					width,
					height
				});
			}
		};
		img.onerror = () => resolve({});
		img.src = src;
	});
};

// PhotoSwipe 需要指定宽高（https://photoswipe.com/getting-started/）
export const open = async (options: Options) => {
	const { data: originalData, current, ...photoSwipeOptions } = options;
	const e = VcInstance.globalEvent as any;
	const items = originalData.map((i) => {
		if (typeof i === 'string') {
			return {
				src: i
			};
		};
		// value/label优先原则
		return {
			...i,
			src: i.value || i.source || i.src
		};
	});
	// 并行获取尺寸，等待时间取决于最慢的一张
	const data = await Promise.all(items.map(async (item) => {
		return item.width ? item : { ...item, ...(await getFitSize(item.src) as any) };
	}));

	const t = (key: string) => translate(`vc.ImagePreview.${key}`, undefined, VcInstance.options.locale);
	const lightbox = new PhotoSwipeLightbox({
		pswpModule: () => import('photoswipe'),
		closeTitle: t('closeTitle'),
		zoomTitle: t('zoomTitle'),
		arrowPrevTitle: t('arrowPrevTitle'),
		arrowNextTitle: t('arrowNextTitle'),

		errorMsg: t('errorMsg'),
		indexIndicatorSep: ' / ',
		wheelToZoom: true,

		// 默认fit展示
		initialZoomLevel: 'fit',
		// 最大展示或按钮+最大展示（如果原图size 乘 secondaryZoomLevel 还在屏幕内，不展示+号）
		secondaryZoomLevel: 4,
		// 滚轮/手势最大展示
		maxZoomLevel: 10,

		...photoSwipeOptions
	});
	lightbox.init();
	lightbox.loadAndOpen(
		current || 0,
		data,
		// 下面无效，需要给官方支持
		{
			x: e?.clientX,
			y: e?.clientY
		}
	);
};
