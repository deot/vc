/** @jsxImportSource vue */

import { computed, defineComponent, Fragment, getCurrentInstance } from 'vue';
import { ImagePreview } from '../../../image-preview';
import { VcInstance } from '../../../vc';
import { Icon } from '../../../icon';
import { Image } from '../../../image';
import { Spin } from '../../../spin';
import { getAvailableIndex, getAvailableValues } from '../../utils';

export const MImageItem = defineComponent({
	name: 'vcm-upload-picker-image-item',
	props: {
		imageClass: [String, Object, Array],
		disabled: Boolean,
		row: { type: Object, default: () => ({}) },
		imagePreviewOptions: { type: Object, default: () => ({}) },
		index: [String, Number],
		data: { type: Array, default: () => ([]) },
		keyValue: Object
	},
	emits: ['open', 'close', 'remove'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance();
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});
		const getPreviewData = () => getAvailableValues(props.data, props.keyValue!.value);
		const handlePreview = () => {
			let { enhancer } = VcInstance.options.ImagePreview || {};
			enhancer = props.imagePreviewOptions.enhancer || enhancer || (() => false);
			const images = getPreviewData().map(value => ({ value }));
			enhancer(current.value, images, instance) || ImagePreview.open({
				current: current.value,
				data: getPreviewData(),
				onClose: () => emit('close')
			});
			emit('open');
		};

		return () => {
			const row = props.row;
			const value = row[props.keyValue!.value];
			const isError = row.status === 0 || !!row.errorFlag;
			return (
				<div class={[{ 'is-error': isError }, 'vcm-upload-image-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										{
											!row.errorFlag && typeof value === 'string'
												? (
														<Image
															src={value}
															class={[props.imageClass, 'vcm-upload-image-item__content']}
															fit="cover"
															previewable={false}
															// @ts-ignore
															onClick={handlePreview}
														/>
													)
												: (
														<div class={[props.imageClass, 'vcm-upload-image-item__content']}>
															{ isError ? <div style="padding: 5px">上传失败</div> : <Spin size={20} /> }
														</div>
													)
										}
										{
											(!props.disabled || row.errorFlag) && (
												<Icon
													type="close"
													class="vcm-upload-picker__delete"
													// @ts-ignore
													onClick={() => emit('remove')}
												/>
											)
										}
									</Fragment>
								)
					}
				</div>
			);
		};
	}
});
