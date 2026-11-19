import { describe, expect, it } from 'vitest';
import {
	clampTransform,
	fitRect,
	fromCropData,
	getCoverScale,
	isCovered,
	isInside,
	mapTransform,
	resizeRect,
	rotateAt,
	searchValid,
	toCropData,
	zoomAt
} from '../geometry';
import type { Rect, Transform } from '../geometry';

const image = { width: 400, height: 200 };
const frame: Rect = { x: 50, y: 50, width: 100, height: 100 };

const closeTo = (actual: Record<string, number>, expected: Record<string, number>) => {
	Object.keys(expected).forEach(key => expect(actual[key]).toBeCloseTo(expected[key], 6));
};

describe('image-crop geometry', () => {
	it('computes the cover scale for any angle', () => {
		expect(getCoverScale(frame, image, 0)).toBe(0.5);
		expect(getCoverScale(frame, image, 90)).toBeCloseTo(0.5);
		// 45° 时框的包围盒为 100√2
		expect(getCoverScale(frame, image, 45)).toBeCloseTo((100 * Math.SQRT2) / 200);
		expect(getCoverScale(frame, { width: 0, height: 0 }, 0)).toBe(1);
	});

	it('clamps the center so that the frame stays inside the image', () => {
		[0, 30, 90, 135, -60].forEach((rotate) => {
			const scale = getCoverScale(frame, image, rotate) * 1.3;
			const far: Transform = { x: 900, y: -700, scale, rotate };
			const next = clampTransform(far, frame, image);
			expect(isCovered(next, frame, image)).toBe(true);
			// 已经合法时不动
			expect(clampTransform(next, frame, image)).toEqual(next);
		});
	});

	it('centers the image when the scale cannot cover the frame', () => {
		const next = clampTransform({ x: 0, y: 0, scale: 0.1, rotate: 0 }, frame, image);
		closeTo(next as any, { x: 100, y: 100 });
	});

	it('zooms around an anchor without moving the pixel under it', () => {
		const transform: Transform = { x: 100, y: 100, scale: 1, rotate: 30 };
		const anchor = { x: 140, y: 80 };
		const next = zoomAt(transform, 2.5, anchor);
		// 锚点在图片坐标系中的位置不变
		const local = (t: Transform) => ({ x: (anchor.x - t.x) / t.scale, y: (anchor.y - t.y) / t.scale });
		closeTo(local(next), local(transform));
	});

	it('rotates around an anchor', () => {
		const next = rotateAt({ x: 200, y: 100, scale: 1, rotate: 0 }, 90, { x: 100, y: 100 });
		closeTo(next as any, { x: 100, y: 200, rotate: 90 });
	});

	it('fits a rect with ratio and maps the image along with the frame', () => {
		const area = { x: 10, y: 20, width: 300, height: 200 };
		expect(fitRect(area, 1)).toEqual({ x: 60, y: 20, width: 200, height: 200 });
		expect(fitRect(area, 3)).toEqual({ x: 10, y: 70, width: 300, height: 100 });

		const transform: Transform = { x: 120, y: 90, scale: 0.8, rotate: 20 };
		const to = fitRect(area, 1);
		const next = mapTransform(transform, frame, to);
		// 映射前后裁剪数据相同
		closeTo(toCropData(next, to, image) as any, toCropData(transform, frame, image) as any);
	});

	it('resizes by edges and corners, keeping the ratio when given', () => {
		expect(resizeRect(frame, 'se', 20, 10, null)).toEqual({ x: 50, y: 50, width: 120, height: 110 });
		expect(resizeRect(frame, 'nw', 20, 10, null)).toEqual({ x: 70, y: 60, width: 80, height: 90 });
		expect(resizeRect(frame, 'se', 20, 10, 1)).toEqual({ x: 50, y: 50, width: 120, height: 120 });
		expect(resizeRect(frame, 'nw', -5, -30, 1)).toEqual({ x: 20, y: 20, width: 130, height: 130 });
		expect(resizeRect(frame, 'e', 20, 0, 2)).toEqual({ x: 50, y: 70, width: 120, height: 60 });
		expect(resizeRect(frame, 'n', 0, 20, 1)).toEqual({ x: 60, y: 70, width: 80, height: 80 });
	});

	it('searches the farthest valid position', () => {
		const area = { x: 0, y: 0, width: 200, height: 200 };
		const next = searchValid(t => resizeRect(frame, 'se', 200 * t, 0, null), r => isInside(r, area));
		expect(next.width).toBeCloseTo(150, 1);
		expect(searchValid(t => t, () => true)).toBe(1);
	});

	it('round-trips crop data', () => {
		[0, 90, 33].forEach((rotate) => {
			const transform = clampTransform({ x: 90, y: 110, scale: getCoverScale(frame, image, rotate) * 2, rotate }, frame, image);
			const data = toCropData(transform, frame, image);
			closeTo(fromCropData(data, frame, image) as any, transform as any);
		});
		// 0°：数据就是原图上的矩形
		const data = toCropData({ x: 100, y: 100, scale: 0.5, rotate: 0 }, frame, image);
		closeTo(data as any, { x: 100, y: 0, width: 200, height: 200, rotate: 0 });
		expect(fromCropData({ ...data, rotate: undefined as any }, frame, image).rotate).toBe(0);
	});
});
