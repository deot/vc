/** @jsxImportSource vue */

import { defineComponent, computed, Fragment } from 'vue';
import { useLocale } from '../../locale';
import { Icon } from '../../icon/index';
import { Progress } from '../../progress/index';
import { Image } from '../../image';
import { getAvailableIndex } from '../utils';

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
		index: [String, Number],
		data: {
			type: Array,
			default: () => ([])
		},
		keyValue: Object
	},
	emits: ['preview', 'remove'],
	setup(props, { slots, emit }) {
		const { t } = useLocale();
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});

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
															onClick={() => emit('preview')}
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
																				style="width: 100%;padding: 0 5px"
																			/>
																		)
																	: !value && row.percent === 100 && !row.errorFlag
																			? (
																					<p style="line-height: 1; padding: 5px">
																						{t('vc.UploadPicker.receiving')}
																					</p>
																				)
																			: isError
																				? (<div style="padding: 5px">{t('vc.UploadPicker.failed')}</div>)
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
