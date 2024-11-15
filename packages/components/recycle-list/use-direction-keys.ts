import { watch, reactive, getCurrentInstance } from 'vue';

const getKeys = (v: boolean) => {
	return {
		// size
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

		// x/y
		axis: v ? 'y' : 'x',
		translateAxis: v ? 'translateY' : 'translateX',
		scrollAxis: v ? 'scrollTop' : 'scrollLeft',
		screenAxis: v ? 'screenY' : 'screenX',
	};
};

export const useDirectionKeys = () => {
	const instance = getCurrentInstance()!;
	const props: any = instance.props;
	const keys = reactive(getKeys(props.vertical));

	watch(
		() => props.vertical,
		(v) => {
			Object.assign(keys, getKeys(v));
		}
	);
	return keys;
};
