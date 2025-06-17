import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { VcInstance } from '../../vc'; // VcInstance.globalEvent.target

type Options = {
	current?: number;
	data: any[];
	onClose: any;
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
	const e = VcInstance.globalEvent as any;
	const data = options.data.map((i) => {
		if (typeof i === 'string') {
			return {
				src: i
			};
		};
		return {
			...i,
			src: i.source || i.src
		};
	});
	for (let i = 0; i < data.length; i++) {
		if (!data[i].width) {
			data[i] = {
				...data[i],
				...(await getFitSize(data[i].src) as any),
			};
		}
	}

	const lightbox = new PhotoSwipeLightbox({
		pswpModule: () => import('photoswipe'),
		closeTitle: '关闭(Esc)',
		zoomTitle: '缩放',
		arrowPrevTitle: '上一张',
		arrowNextTitle: '下一张',

		errorMsg: '网络异常 图片加载失败',
		indexIndicatorSep: ' / ',
		initialZoomLevel: 'fit',
	});
	lightbox.init();
	lightbox.loadAndOpen(
		options.current || 0,
		data,
		// 下面无效，需要给官方支持
		{
			x: e?.clientX,
			y: e?.clientY
		}
	);
};
