import { watch, reactive, getCurrentInstance } from 'vue';

/**
 * 按滚动方向生成 DOM / 样式属性名：vertical 时主轴为 Y、交叉轴为 X，反之亦然
 * @param v 是否纵向
 * @returns 属性名映射
 */
const getKeys = (v: boolean) => {
	return {
		// size
		size: v ? 'width' : 'height',
		scrollSize: v ? 'scrollHeight' : 'scrollWidth',
		clientSize: v ? 'clientHeight' : 'clientWidth',
		offsetSize: v ? 'offsetHeight' : 'offsetWidth',
		contentSize: v ? 'height' : 'width',
		columnSize: v ? 'width' : 'height',

		// padding
		paddingColumnHead: v ? 'paddingLeft' : 'paddingTop',
		paddingColumnTail: v ? 'paddingRight' : 'paddingBottom',

		// margin
		marginPullHead: v ? 'marginTop' : 'marginLeft',

		// 主轴 x/y
		axis: v ? 'y' : 'x',
		translateAxis: v ? 'translateY' : 'translateX',
		scrollAxis: v ? 'scrollTop' : 'scrollLeft',
		offsetPosition: v ? 'offsetTop' : 'offsetLeft',
		screenAxis: v ? 'screenY' : 'screenX',

		// 交叉轴（fill=false 时仍由内部 ScrollerWheel 承载）
		crossAxis: v ? 'x' : 'y',
		crossScrollAxis: v ? 'scrollLeft' : 'scrollTop'
	} as const;
};

export type DirectionKeys = ReturnType<typeof getKeys>;

/**
 * 响应 props.vertical 的方向键映射；返回同一 reactive 对象，方向切换时原地更新
 * @returns 方向键映射
 */
export const useDirectionKeys = () => {
	const instance = getCurrentInstance()!;
	const props: any = instance.props;
	const keys = reactive<DirectionKeys>({ ...getKeys(props.vertical) });

	watch(
		() => props.vertical,
		(v) => {
			Object.assign(keys, getKeys(v));
		}
	);
	return keys;
};
