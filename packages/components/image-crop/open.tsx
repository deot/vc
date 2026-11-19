/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import type { PropType } from 'vue';
import { ModalView } from '../modal';
import { Button } from '../button';
import { Slider } from '../slider';
import { useLocale } from '../locale';
import { ImageCrop } from './image-crop';
import { portalProps, props as imageCropProps } from './image-crop-props';
import type { Props } from './image-crop-props';
import { createImageCropOpen, useImageCropPortal } from './use-image-crop-portal';

/**
 * 弹窗内容：裁剪区与下方的旋转按钮、缩放滑块
 * 单独成组件：缩放时只更新这里，不带动整个 Modal
 */
const ImageCropPortalContent = defineComponent({
	name: 'vc-image-crop-portal-content',
	props: {
		cropOptions: {
			type: Object as PropType<Partial<Props>>,
			required: true
		},
		isReady: Boolean
	},
	emits: ['load'],
	setup(props, { emit, expose }) {
		const { t } = useLocale();
		const crop = ref<any>();
		const rotate = ref(props.cropOptions.rotate || 0);
		const zoom = ref(props.cropOptions.zoom || 1);

		expose({
			getImage: (...args: any[]) => crop.value.getImage(...args),
			getData: () => crop.value.getData()
		});

		const handleLoad = () => emit('load');

		return () => (
			<>
				<ImageCrop
					ref={crop}
					{...props.cropOptions}
					v-model:rotate={rotate.value}
					v-model:zoom={zoom.value}
					onLoad={handleLoad}
				/>
				<div class="vc-image-crop-portal__toolbar">
					<Button icon="rotate-left" aria-label={t('vc.FilePreview.rotateLeft')} onClick={() => (rotate.value -= 90)} />
					<Button icon="rotate-right" aria-label={t('vc.FilePreview.rotateRight')} onClick={() => (rotate.value += 90)} />
					<Slider
						v-model={zoom.value}
						class="vc-image-crop-portal__zoom"
						min={1}
						max={Math.max(1, props.cropOptions.maxZoom ?? imageCropProps.maxZoom.default)}
						step={0.01}
						disabled={!props.isReady}
					/>
				</div>
			</>
		);
	}
});

/**
 * ImageCrop.open 的弹层：Modal 内裁剪；确定后导出再关闭。确定 / 取消文案默认同 Modal
 */
export const ImageCropPortalView = defineComponent({
	name: 'vc-image-crop-portal',
	props: portalProps,
	emits: ['portal-fulfilled', 'portal-rejected'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const { crop, isActive, isReady, confirm, settle, handleLoad } = useImageCropPortal(props, emit);

		return () => (
			<ModalView
				v-model={isActive.value}
				class="vc-image-crop-portal"
				title={props.title ?? t('vc.ImageCrop.title')}
				width={520}
				okText={props.okText}
				cancelText={props.cancelText}
				okDisabled={!isReady.value}
				maskClosable={false}
				onOk={confirm}
				onClose={settle}
			>
				<ImageCropPortalContent
					ref={crop}
					cropOptions={props.cropOptions}
					isReady={isReady.value}
					onLoad={handleLoad}
				/>
			</ModalView>
		);
	}
});

/**
 * 在 Modal 中裁剪图片
 * @param options 裁剪属性、导出选项（同 getImage）与 title / okText / cancelText
 * @returns 可 await：确定后得到 { dataURL, file?, data }，取消时拒绝
 */
export const open = createImageCropOpen(ImageCropPortalView);
