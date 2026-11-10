// 进入 / 离开、跟手滑出 / 回弹、档位之间的过渡共用一条曲线
export const EASING = 'cubic-bezier(0.34, 0.69, 0.1, 1)';
// 跟手后的滑出 / 回弹（与离场动画一致）
export const SWIPE_DURATION = 240;
// 档位之间的过渡
export const SNAP_DURATION = 300;

/**
 * 元素此刻（含过渡中）的平移量：读取计算样式的 transform
 * @param el ~
 * @param axis ~
 * @returns px
 */
export const getTranslate = (el: HTMLElement, axis: 'x' | 'y') => {
	const value = window.getComputedStyle(el).transform || '';
	const matrix = /^matrix(3d)?\((.+)\)$/.exec(value);
	if (matrix) {
		const numbers = matrix[2].split(',').map(parseFloat);
		return (matrix[1] ? numbers[axis === 'x' ? 12 : 13] : numbers[axis === 'x' ? 4 : 5]) || 0;
	}
	// 没有布局的环境（jsdom）计算样式即行内的值
	const translate = /translate([XY])\((-?[\d.]+)px\)/.exec(value);
	return translate && translate[1].toLowerCase() === axis ? parseFloat(translate[2]) : 0;
};

/**
 * 同一时长与曲线的 transition
 * @param keys 属性
 * @param duration ms
 * @returns transition 的值
 */
export const ease = (keys: string[], duration: number) => keys.map(key => `${key} ${duration}ms ${EASING}`).join(', ');
