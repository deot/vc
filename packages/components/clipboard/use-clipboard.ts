import { getCurrentInstance, h } from 'vue';
import { copyToClipboard } from './utils';

export const useClipboard = (done: any) => {
	const instance = getCurrentInstance()!;
	const { props, emit, slots } = instance;
	const handleClick = async (e: any) => {
		try {
			// 此处不用this.$emit('xxx')
			let { value, onAfter, onBefore } = instance.vnode.props!;

			onBefore && (value = await onBefore(e, value));

			const success = copyToClipboard(value);

			if (success) {
				onAfter && onAfter(value);
				!onAfter && done(`复制成功`);
			}
		} catch (error) {
			emit('error', error);
		}
	};

	return () => h(props.tag as string, { onClick: handleClick, class: 'vc-clipboard' }, slots?.default?.());
};
