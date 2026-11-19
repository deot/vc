/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { Icon } from '../../icon';
import { MDivider } from '../../divider/index.m';
import { MTransitionSlide } from '../../transition/index.m';
import { useLocale } from '../../locale';
import { MImageCrop } from './image-crop';
import { portalProps } from '../image-crop-props';
import { createImageCropOpen, useImageCropPortal } from '../use-image-crop-portal';

/**
 * MImageCrop.open 的全屏层：黑底，裁剪区占满，底部「取消 / 旋转 | 还原 / 确定」（文案同 MPicker）
 */
export const MImageCropPortalView = defineComponent({
	name: 'vcm-image-crop-portal',
	props: portalProps,
	emits: ['portal-fulfilled', 'portal-rejected'],
	setup(props, { emit }) {
		const { t } = useLocale();
		const { crop, isActive, isReady, confirm, settle, handleLoad } = useImageCropPortal(props, emit);
		const rotate = ref(props.cropOptions.rotate || 0);

		const handleCancel = () => {
			isActive.value = false;
		};

		const handleOk = async () => {
			if (!isReady.value) return;
			await confirm();
			isActive.value = false;
		};

		const handleRotate = () => {
			rotate.value -= 90;
		};

		const handleReset = () => {
			crop.value?.reset();
		};

		return () => (
			// TransitionSlide 不声明事件，onAfterLeave 经 attrs 透传（同 MPopup）
			// @ts-ignore
			<MTransitionSlide mode="bottom-part" onAfterLeave={settle}>
				{isActive.value && (
					<div class="vcm-image-crop-portal">
						<MImageCrop
							ref={crop}
							{...props.cropOptions}
							v-model:rotate={rotate.value}
							class="vcm-image-crop-portal__stage"
							onLoad={handleLoad}
						/>
						<div class="vcm-image-crop-portal__toolbar">
							<span class="vcm-image-crop-portal__button" onClick={handleCancel}>
								{props.cancelText ?? t('vc.Picker.cancelText')}
							</span>
							<span class="vcm-image-crop-portal__tools">
								<span
									class="vcm-image-crop-portal__button"
									role="button"
									aria-label={t('vc.FilePreview.rotateLeft')}
									onClick={handleRotate}
								>
									<Icon type="rotate-left" class="vcm-image-crop-portal__icon" />
								</span>
								<MDivider vertical class="vcm-image-crop-portal__divider" />
								<span class="vcm-image-crop-portal__button" onClick={handleReset}>
									{t('vc.ImageCrop.resetText')}
								</span>
							</span>
							<span
								class={['vcm-image-crop-portal__button', 'is-primary', { 'is-disabled': !isReady.value }]}
								onClick={handleOk}
							>
								{props.okText ?? t('vc.Picker.okText')}
							</span>
						</div>
					</div>
				)}
			</MTransitionSlide>
		);
	}
});

/**
 * 全屏裁剪图片
 * @param options 裁剪属性、导出选项（同 getImage）与 okText / cancelText
 * @returns 可 await：确定后得到 { dataURL, file?, data }，取消时拒绝
 */
export const open = createImageCropOpen(MImageCropPortalView);
