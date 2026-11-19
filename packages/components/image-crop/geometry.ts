// 裁剪几何：舞台坐标（px，y 向下），角度为度、顺时针为正（同 CSS rotate）
// 图片的状态是 { x, y, scale, rotate }：中心在舞台上的位置、每个原图像素对应的舞台像素、角度

export interface Point {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface Rect extends Point, Size {}

export interface Transform extends Point {
	scale: number;
	rotate: number;
}

/**
 * 原图像素坐标：先把原图按 rotate 旋转（画布扩展到旋转后的包围盒），再取 (x, y, width, height)
 */
export interface CropData extends Rect {
	rotate: number;
}

export type Direction = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const toRadian = (deg: number) => (deg * Math.PI) / 180;

const getTrig = (rotate: number) => {
	const radian = toRadian(rotate);
	return { cos: Math.cos(radian), sin: Math.sin(radian) };
};

// 舞台坐标转到随图片旋转的坐标系（逆时针转 rotate）
const unrotate = (p: Point, rotate: number): Point => {
	const { cos, sin } = getTrig(rotate);
	return { x: p.x * cos + p.y * sin, y: -p.x * sin + p.y * cos };
};

const rotatePoint = (p: Point, rotate: number): Point => unrotate(p, -rotate);

const getCorners = (rect: Rect): Point[] => [
	{ x: rect.x, y: rect.y },
	{ x: rect.x + rect.width, y: rect.y },
	{ x: rect.x, y: rect.y + rect.height },
	{ x: rect.x + rect.width, y: rect.y + rect.height }
];

export const getCenter = (rect: Rect): Point => ({
	x: rect.x + rect.width / 2,
	y: rect.y + rect.height / 2
});

/**
 * 旋转后的包围盒尺寸
 * @param size ~
 * @param rotate ~
 * @returns ~
 */
export const getBoundingSize = (size: Size, rotate: number): Size => {
	const { cos, sin } = getTrig(rotate);
	const c = Math.abs(cos);
	const s = Math.abs(sin);
	return {
		width: size.width * c + size.height * s,
		height: size.width * s + size.height * c
	};
};

/**
 * 图片转 rotate 后刚好铺满裁剪框的缩放
 * @param frame 裁剪框
 * @param image 原图尺寸
 * @param rotate ~
 * @returns ~
 */
export const getCoverScale = (frame: Size, image: Size, rotate: number) => {
	if (!image.width || !image.height) return 1;
	// 裁剪框转到图片坐标系下的包围盒，需要落在图片内
	const bounding = getBoundingSize(frame, -rotate);
	return Math.max(bounding.width / image.width, bounding.height / image.height);
};

/**
 * 夹取图片中心，使裁剪框四角都落在图片内
 * 裁剪框四角转到图片坐标系后，中心的合法区域是一个轴对齐矩形：在那里 clamp 再转回舞台
 * 缩放不足以铺满时（区域为空）取区域中点
 * @param transform ~
 * @param frame ~
 * @param image ~
 * @returns ~
 */
export const clampTransform = (transform: Transform, frame: Rect, image: Size): Transform => {
	const { scale, rotate } = transform;
	const corners = getCorners(frame).map(p => unrotate(p, rotate));
	const center = unrotate(transform, rotate);
	const halfWidth = (image.width * scale) / 2;
	const halfHeight = (image.height * scale) / 2;
	const xs = corners.map(p => p.x);
	const ys = corners.map(p => p.y);
	const clamp = (value: number, min: number, max: number) => (
		min > max ? (min + max) / 2 : Math.min(max, Math.max(min, value))
	);
	const next = rotatePoint({
		x: clamp(center.x, Math.max(...xs) - halfWidth, Math.min(...xs) + halfWidth),
		y: clamp(center.y, Math.max(...ys) - halfHeight, Math.min(...ys) + halfHeight)
	}, rotate);
	return { ...transform, x: next.x, y: next.y };
};

/**
 * 裁剪框是否完全落在图片内
 * @param transform ~
 * @param frame ~
 * @param image ~
 * @returns ~
 */
export const isCovered = (transform: Transform, frame: Rect, image: Size) => {
	const { scale, rotate } = transform;
	// 容差：浮点误差不应让刚好贴边的框判为越界
	const halfWidth = (image.width * scale) / 2 + 0.01;
	const halfHeight = (image.height * scale) / 2 + 0.01;
	return getCorners(frame).every((p) => {
		const local = unrotate({ x: p.x - transform.x, y: p.y - transform.y }, rotate);
		return Math.abs(local.x) <= halfWidth && Math.abs(local.y) <= halfHeight;
	});
};

/**
 * 以锚点缩放：锚点下的图片像素不动
 * @param transform ~
 * @param scale 新的缩放
 * @param anchor 舞台坐标
 * @returns ~
 */
export const zoomAt = (transform: Transform, scale: number, anchor: Point): Transform => {
	const ratio = scale / transform.scale;
	return {
		...transform,
		scale,
		x: anchor.x + (transform.x - anchor.x) * ratio,
		y: anchor.y + (transform.y - anchor.y) * ratio
	};
};

/**
 * 绕锚点旋转到 rotate
 * @param transform ~
 * @param rotate ~
 * @param anchor ~
 * @returns ~
 */
export const rotateAt = (transform: Transform, rotate: number, anchor: Point): Transform => {
	const offset = rotatePoint({ x: transform.x - anchor.x, y: transform.y - anchor.y }, rotate - transform.rotate);
	return { ...transform, rotate, x: anchor.x + offset.x, y: anchor.y + offset.y };
};

/**
 * 区域内按比例最大、居中的矩形
 * @param area ~
 * @param ratio 宽高比
 * @returns ~
 */
export const fitRect = (area: Rect, ratio: number): Rect => {
	const width = Math.min(area.width, area.height * ratio);
	const height = width / ratio;
	return {
		x: area.x + (area.width - width) / 2,
		y: area.y + (area.height - height) / 2,
		width,
		height
	};
};

/**
 * 裁剪框从 from 换到 to 时，图片随之映射（框内内容不变）
 * @param transform ~
 * @param from ~
 * @param to ~
 * @returns ~
 */
export const mapTransform = (transform: Transform, from: Rect, to: Rect): Transform => {
	const ratio = to.width / from.width;
	const a = getCenter(from);
	const b = getCenter(to);
	return {
		...transform,
		scale: transform.scale * ratio,
		x: b.x + (transform.x - a.x) * ratio,
		y: b.y + (transform.y - a.y) * ratio
	};
};

/**
 * 拖动边或角后的裁剪框；有 ratio 时保持比例，以对边（对角）为锚
 * @param rect 开始拖动时的框
 * @param direction ~
 * @param dx 相对开始的位移
 * @param dy ~
 * @param ratio 宽高比，不限时为 null
 * @returns ~
 */
export const resizeRect = (rect: Rect, direction: Direction, dx: number, dy: number, ratio: number | null): Rect => {
	const hasW = direction.includes('w');
	const hasE = direction.includes('e');
	const hasN = direction.includes('n');
	const hasS = direction.includes('s');
	let width = rect.width + (hasE ? dx : hasW ? -dx : 0);
	let height = rect.height + (hasS ? dy : hasN ? -dy : 0);

	if (ratio) {
		if ((hasE || hasW) && (hasN || hasS)) {
			// 角：取变化更大的一边
			Math.abs(width - rect.width) >= Math.abs(height * ratio - rect.width)
				? (height = width / ratio)
				: (width = height * ratio);
		} else if (hasE || hasW) {
			height = width / ratio;
		} else {
			width = height * ratio;
		}
	}

	// 有比例时，拖边：另一方向以中线为锚
	const x = hasW ? rect.x + rect.width - width : hasE ? rect.x : rect.x + (rect.width - width) / 2;
	const y = hasN ? rect.y + rect.height - height : hasS ? rect.y : rect.y + (rect.height - height) / 2;
	return { x, y, width, height };
};

/**
 * 沿位移方向二分，找到最远的合法位置；起点须合法
 * @param resolve 位移比例 t（0–1）对应的值
 * @param isValid ~
 * @returns ~
 */
export const searchValid = <T>(resolve: (t: number) => T, isValid: (value: T) => boolean): T => {
	const end = resolve(1);
	if (isValid(end)) return end;
	let low = 0;
	let high = 1;
	for (let i = 0; i < 16; i++) {
		const mid = (low + high) / 2;
		isValid(resolve(mid)) ? (low = mid) : (high = mid);
	}
	return resolve(low);
};

export const isInside = (rect: Rect, area: Rect) => (
	rect.x >= area.x - 0.01
	&& rect.y >= area.y - 0.01
	&& rect.x + rect.width <= area.x + area.width + 0.01
	&& rect.y + rect.height <= area.y + area.height + 0.01
);

/**
 * 当前裁剪对应的原图数据
 * @param transform ~
 * @param frame ~
 * @param image ~
 * @returns ~
 */
export const toCropData = (transform: Transform, frame: Rect, image: Size): CropData => {
	const { scale, rotate } = transform;
	const bounding = getBoundingSize(image, rotate);
	return {
		x: (frame.x - transform.x) / scale + bounding.width / 2,
		y: (frame.y - transform.y) / scale + bounding.height / 2,
		width: frame.width / scale,
		height: frame.height / scale,
		rotate
	};
};

/**
 * 由原图数据还原图片状态（toCropData 的逆运算）；按宽度对齐裁剪框
 * @param data ~
 * @param frame ~
 * @param image ~
 * @returns ~
 */
export const fromCropData = (data: CropData, frame: Rect, image: Size): Transform => {
	const rotate = data.rotate || 0;
	const scale = frame.width / data.width;
	const bounding = getBoundingSize(image, rotate);
	return {
		scale,
		rotate,
		x: frame.x - (data.x - bounding.width / 2) * scale,
		y: frame.y - (data.y - bounding.height / 2) * scale
	};
};

/**
 * 按原图数据绘制到 canvas（尺寸由调用方设置）
 * @param context ~
 * @param source ~
 * @param data ~
 * @param image ~
 */
export const drawCrop = (
	context: CanvasRenderingContext2D,
	source: CanvasImageSource,
	data: CropData,
	image: Size
) => {
	const { canvas } = context;
	const bounding = getBoundingSize(image, data.rotate);
	context.save();
	context.scale(canvas.width / data.width, canvas.height / data.height);
	context.translate(bounding.width / 2 - data.x, bounding.height / 2 - data.y);
	context.rotate(toRadian(data.rotate));
	context.drawImage(source, -image.width / 2, -image.height / 2, image.width, image.height);
	context.restore();
};
