import type { FilePreviewImageFit } from '../../types';
import type { RectLike } from '../../../vc';
import type { Point, Size } from '../utils';

export type Frame = { x: number; y: number; scale: number };

const turnOf = (rotation: number) => ((rotation % 360) + 360) % 360;

/**
 * 90°、270° 时宽高对调，适配、拖动和缩放都按旋转后的外接矩形算
 * @param natural 图片未旋转的尺寸
 * @param rotation 累计旋转角度
 * @returns 旋转后的外接尺寸
 */
export const orientedSize = (natural: Size, rotation: number): Size => {
	return turnOf(rotation) % 180 === 0 ? natural : { w: natural.h, h: natural.w };
};

/**
 * frame 是旋转后外接矩形的左上角。rotate 绕元素原点顺时针，不为 0° 时把这块区域补回 frame。
 * rotation 保留累计角度，这样 270° 再转 90° 会转到 360°，而不是从 270° 转回 0°。
 * @param frame 外接矩形
 * @param rotation 累计旋转角度
 * @param natural 图片未旋转的尺寸
 * @returns transform
 */
export const imageTransform = (frame: Frame, rotation: number, natural: Size) => {
	const turn = turnOf(rotation);
	const w = natural.w * frame.scale;
	const h = natural.h * frame.scale;
	let ox = 0;
	let oy = 0;
	if (turn === 90) ox = h;
	else if (turn === 180) {
		ox = w;
		oy = h;
	} else if (turn === 270) oy = w;
	return `translate3d(${frame.x + ox}px, ${frame.y + oy}px, 0) rotate(${rotation}deg) scale(${frame.scale})`;
};

// 最大边：整图可见，小图放大到长边贴齐视口；实际尺寸：不放大，超出视口时同比例缩小
export const getBaseScale = (natural: Size, viewport: Size, fit: FilePreviewImageFit) => {
	if (natural.w <= 0 || natural.h <= 0 || viewport.w <= 0 || viewport.h <= 0) return 1;
	const contain = Math.min(viewport.w / natural.w, viewport.h / natural.h);
	return fit === 'actual' ? Math.min(1, contain) : contain;
};

export const fitFrame = (natural: Size, viewport: Size, scale: number): Frame => ({
	x: (viewport.w - natural.w * scale) / 2,
	y: (viewport.h - natural.h * scale) / 2,
	scale
});

export const clampFrame = (frame: Frame, natural: Size, viewport: Size): Frame => {
	const w = natural.w * frame.scale;
	const h = natural.h * frame.scale;
	const x = w <= viewport.w ? (viewport.w - w) / 2 : Math.min(0, Math.max(viewport.w - w, frame.x));
	const y = h <= viewport.h ? (viewport.h - h) / 2 : Math.min(0, Math.max(viewport.h - h, frame.y));
	return { x, y, scale: frame.scale };
};

// 以 origin 为中心缩放到 next，限制在 [min, max]
export const zoomAt = (frame: Frame, next: number, origin: Point, min: number, max: number): Frame => {
	const scale = Math.min(max, Math.max(min, next));
	const ratio = frame.scale ? scale / frame.scale : 1;
	return {
		x: origin.x - (origin.x - frame.x) * ratio,
		y: origin.y - (origin.y - frame.y) * ratio,
		scale
	};
};

// 平移后限制在视口内，leftover 为横向被边缘挡住的部分（用于继续滑动切换）
export const pan = (frame: Frame, delta: Point, natural: Size, viewport: Size) => {
	const raw = { x: frame.x + delta.x, y: frame.y + delta.y, scale: frame.scale };
	const next = clampFrame(raw, natural, viewport);
	return { frame: next, leftover: raw.x - next.x };
};

// 未旋转时 frame 在视口里的盒子
export const frameRect = (frame: Frame, natural: Size): RectLike => ({
	left: frame.x,
	top: frame.y,
	width: natural.w * frame.scale,
	height: natural.h * frame.scale
});
