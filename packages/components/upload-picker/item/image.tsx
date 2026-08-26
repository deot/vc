/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, computed, Fragment } from 'vue';
import { ImagePreview } from '../../image-preview/index';
import { VcInstance } from '../../vc/index';
import { Icon } from '../../icon/index';
import { Progress } from '../../progress/index';
import { Image } from '../../image';
import { getAvailableIndex, getAvailableValues } from '../utils';

const COMPONENT_NAME = 'vc-upload-picker-image-item';

export const ImageItem = defineComponent({
	name: COMPONENT_NAME,
	props: {
		imageClass: [String, Object, Array],
		disabled: Boolean,
		row: {
			type: Object,
			default: () => ({})
		},
		imagePreviewOptions: {
			type: Object,
			default: () => ({})
		},
		index: [String, Number],
		data: {
			type: Array,
			default: () => ([])
		},
		keyValue: Object
	},
	emits: ['open', 'close', 'remove'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance();
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});
		// 拿到可预览的图片，供预览组件使用
		const getPreviewData = () => {
			return getAvailableValues(props.data, props.keyValue!.value);
		};
		const previewByPS = (e: any, index: number) => {
			emit('open');
			ImagePreview.open({
				current: index,
				data: getPreviewData(),
				onClose: () => emit('close'),
			});
		};
		const handlePreview = (e) => {
			/**
			 * 渐进增强
			 */
			let { enhancer } = VcInstance.options.ImagePreview || {};

			enhancer = props.imagePreviewOptions.enhancer || enhancer || (() => false);
			const images = getPreviewData().map(item => ({ value: item }));
			enhancer(current.value, images, instance) || previewByPS(e, current.value);
		};

		const handleRemove = () => {
			emit('remove');
		};

		return () => {
			const row = props.row;
			const value = row[props.keyValue!.value];
			const isError = row.status === 0 || !!row.errorFlag;
			return (
				<div
					class={[{ 'is-error': isError }, 'vc-upload-image-item']}
				>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										{
											!row.errorFlag && typeof value === 'string'
												? (
														<Image
														// @ts-ignore
															src={value}
															class={[props.imageClass, 'vc-upload-image-item__content']}
															fit="cover"
															previewable={false}
															// @ts-ignore
															onClick={handlePreview}
														/>
													)
												: (
														<div class={[props.imageClass, 'vc-upload-image-item__content']}>
															{
																row.percent && row.percent != 100
																	? (
																			<Progress
																				percent={row.percent}
																				show-text={false}
																				status="normal"
																				style="width: 100%;padding: 0 5px"
																			/>
																		)
																	: !value && row.percent === 100 && !row.errorFlag
																			? (<p style="line-height: 1; padding: 5px">服务器正在接收...</p>)
																			: isError
																				? (<div style="padding: 5px">上传失败</div>)
																				: null
															}

														</div>
													)
										}
										{
											(!props.disabled || row.errorFlag) && (
												<Icon
													type="close-small"
													class="vc-upload-picker__delete"
													// @ts-ignore
													onClick={handleRemove}
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
