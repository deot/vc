/** @jsxImportSource vue */

import { defineComponent, getCurrentInstance, computed, Fragment } from 'vue';
import { ImagePreview } from '../../image-preview/index';
import { VcInstance } from '../../vc/index';
import { Icon } from '../../icon/index';
import { Progress } from '../../progress/index';
import { Image } from '../../image';

const COMPONENT_NAME = 'vc-steps';

export const ImageItem = defineComponent({
	name: COMPONENT_NAME,
	props: {
		imageClass: [String, Object, Array],
		disabled: Boolean,
		row: Object,
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
	emits: ['open', 'close', 'delete'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance();
		const current = computed(() => {
			if ((props.row as any)?.status === 0) return -1;
			const v = props.data.filter((i: any) => i.status !== 0);

			return v.findIndex((i: any) => {
				const a = i[props.keyValue!.value] || i;
				const b = props.row?.[props.keyValue!.value] || props.row;
				return a === b;
			});
		});
		// 拿到可预览的图片，供预览组件使用
		const getPreviewData = () => {
			return props.data.map((i: any) => i?.[props.keyValue!.value]);
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
			const images = getPreviewData().map(item => ({ src: item }));
			enhancer(current.value, images, instance) || previewByPS(e, current.value);
		};

		const handleDel = () => {
			emit('delete');
		};

		return () => {
			const row = props.row as any;
			return (
				<div
					class={[{ 'is-error': row.status == 0 }, 'vc-upload-image-item']}
				>
					{
						slots.default
							? slots.default({ it: row, current: current.value })
							: (
									<Fragment>
										{}
										{
											!row.errorFlag && typeof row[props.keyValue!.value] === 'string'
												? (
														<Image
															// @ts-ignore
															src={row[props.keyValue.value]}
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
																	: !row[props.keyValue!.value] && row.percent === 100 && !row.errorFlag
																			? (<p style="line-height: 1; padding: 5px">服务器正在接收...</p>)
																			: row.status == 0
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
													onClick={handleDel}
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
