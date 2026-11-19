import { onMounted, ref } from 'vue';
import type { Component } from 'vue';
import { Portal } from '../portal';
import { toPortalProps } from './image-crop-props';
import type { ImageCropImageOptions, ImageCropOpenOptions, ImageCropOpenResult } from './image-crop-props';

interface PortalProps {
	imageOptions: ImageCropImageOptions;
}

type PortalEmit = (event: 'portal-fulfilled' | 'portal-rejected', ...args: any[]) => void;

/**
 * open() 弹层（桌面端 Modal、移动端全屏层）共用：挂载后打开，确定时先导出，关闭动画结束后兑现或拒绝
 * @param props ~
 * @param emit ~
 * @returns crop 绑到提供 getImage / getData 的组件上
 */
export const useImageCropPortal = (props: PortalProps, emit: PortalEmit) => {
	const crop = ref<any>();
	const isActive = ref(false);
	const isReady = ref(false);
	let result: ImageCropOpenResult | undefined;

	onMounted(() => (isActive.value = true));

	// 导出失败时拒绝，弹层保持打开
	const confirm = async () => {
		const image = await crop.value.getImage(props.imageOptions);
		result = { ...image, data: crop.value.getData() };
	};

	const settle = () => {
		result ? emit('portal-fulfilled', result) : emit('portal-rejected');
	};

	const handleLoad = () => {
		isReady.value = true;
	};

	return { crop, isActive, isReady, confirm, settle, handleLoad };
};

/**
 * 创建 open(options)：返回的 Portal 实例可 await，确定后得到 { dataURL, file?, data }，取消时拒绝
 * 只用回调、不 await 时，取消不会产生未处理的拒绝（同 MPicker.open）
 * @param view 弹层组件
 * @returns ~
 */
export const createImageCropOpen = (view: Component) => {
	const portal = new Portal(view, {
		leaveDelay: 0,
		multiple: true
	});
	return (options: ImageCropOpenOptions) => {
		const leaf = portal.popup(toPortalProps(options));
		leaf.catch(() => {});
		return leaf as typeof leaf & Promise<ImageCropOpenResult>;
	};
};
