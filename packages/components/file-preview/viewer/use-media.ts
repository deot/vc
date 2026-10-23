import { onBeforeUnmount, shallowRef, watch } from 'vue';

/**
 * 视频、音频离开当前页或卸载时暂停
 * @param active 是否为当前页
 * @returns 绑到媒体元素上的 ref
 */
export const useMedia = (active: () => boolean) => {
	const media = shallowRef<HTMLMediaElement>();
	const pause = () => media.value?.pause();

	watch(active, v => !v && pause());
	onBeforeUnmount(pause);

	return media;
};
