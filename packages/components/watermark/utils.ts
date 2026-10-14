export type WatermarkFont = {
	color: string;
	font: string;
	lineHeight: number;
	// 用于判断字体是否变化
	signature: string;
};

export type WatermarkTile = {
	url: string;
	width: number;
	height: number;
};

type TileOptions = {
	// 旋转前单个水印的宽高
	width?: number;
	height?: number;
	rotate: number;
	gap: number[];
};

const DEFAULT_FONT_SIZE = 14;
const DEFAULT_COLOR = 'rgba(128, 128, 128, 0.2)';
const DEFAULT_IMAGE_WIDTH = 100;

// 所有水印共用一块画布：改变尺寸即重置，不必每次新建
let shared: HTMLCanvasElement | undefined;
const getContext = () => {
	shared = shared || document.createElement('canvas');
	return shared.getContext('2d');
};

// 数字表示两个方向相同；数组缺第二项时取第一项
export const toPair = (value: number | number[] | undefined, fallback: number[]) => {
	if (Array.isArray(value)) {
		return [value[0] ?? fallback[0], value[1] ?? value[0] ?? fallback[1]];
	}
	return typeof value === 'number' ? [value, value] : fallback;
};

// 文字的颜色与字体取自水印层的 computed style（由 class / style / 主题决定）
export const getFont = (el: HTMLElement): WatermarkFont => {
	const style = getComputedStyle(el);
	const fontSize = parseFloat(style.fontSize) || DEFAULT_FONT_SIZE;
	const color = style.color || DEFAULT_COLOR;
	const font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`;
	// line-height: normal 时取字号的 1.2 倍
	const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;

	return {
		color,
		font,
		lineHeight,
		signature: `${color}|${font}|${lineHeight}`
	};
};

/**
 * 画布即一块瓦片：内容旋转后的包围盒 + gap，内容居中，由 background-repeat 平铺
 * 画布按设备像素比放大，坐标原点移到中心，之后以 CSS px 绘制
 * @param context ~
 * @param size 旋转前内容的宽高
 * @param options ~
 * @returns 瓦片的宽高（CSS px）
 */
const setCanvas = (context: CanvasRenderingContext2D, size: number[], options: TileOptions) => {
	const { canvas } = context;
	const angle = (options.rotate * Math.PI) / 180;
	const sin = Math.abs(Math.sin(angle));
	const cos = Math.abs(Math.cos(angle));
	// 减去一个极小值，避免 cos(90°) 这类浮点误差多取 1px
	const width = Math.ceil(size[0] * cos + size[1] * sin - 1e-6) + options.gap[0];
	const height = Math.ceil(size[0] * sin + size[1] * cos - 1e-6) + options.gap[1];
	const ratio = window.devicePixelRatio || 1;

	canvas.width = Math.round(width * ratio);
	canvas.height = Math.round(height * ratio);
	context.translate(canvas.width / 2, canvas.height / 2);
	context.scale(ratio, ratio);
	context.rotate(angle);

	return { width, height };
};

export const drawText = (options: TileOptions & { lines: string[]; font: WatermarkFont }): WatermarkTile | null => {
	const { lines, font } = options;
	const context = getContext();
	if (!context) return null;

	context.font = font.font;
	const width = options.width || Math.ceil(Math.max(...lines.map(line => context.measureText(line).width)));
	const height = options.height || lines.length * font.lineHeight;
	const tile = setCanvas(context, [width, height], options);

	// 改变画布尺寸会重置上下文，字体需重新设置
	context.font = font.font;
	context.fillStyle = font.color;
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	lines.forEach((line, index) => {
		// 逐行居中；超出 width 时由 maxWidth 压缩
		context.fillText(line, 0, (index - (lines.length - 1) / 2) * font.lineHeight, width);
	});

	return { url: context.canvas.toDataURL(), ...tile };
};

export const drawImage = (options: TileOptions & { image: HTMLImageElement }): WatermarkTile | null => {
	const { image } = options;
	const context = getContext();
	if (!context) return null;

	// 只给一边时另一边按图片比例；都不给时宽为 100
	const scale = image.width / image.height || 1;
	const width = options.width || (options.height ? options.height * scale : DEFAULT_IMAGE_WIDTH);
	const height = options.height || width / scale;
	const tile = setCanvas(context, [width, height], options);

	context.drawImage(image, -width / 2, -height / 2, width, height);

	return { url: context.canvas.toDataURL(), ...tile };
};
