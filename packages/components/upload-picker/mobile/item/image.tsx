/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { useLocale } from '../../../locale';
import { Icon } from '../../../icon';
import { Image } from '../../../image';
import { Spin } from '../../../spin';
import { getAvailableIndex } from '../../utils';

export const MImageItem = defineComponent({
	name: 'vcm-upload-picker-image-item',
	props: {
		imageClass: [String, Object, Array],
		disabled: Boolean,
		row: { type: Object, default: () => ({}) },
		index: [String, Number],
		data: { type: Array, default: () => ([]) },
		keyValue: Object
	},
	emits: ['preview', 'remove'],
	setup(props, { slots, emit }) {
		const { t } = useLocale();
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});

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
															onClick={() => emit('preview')}
														/>
													)
												: (
														<div class={[props.imageClass, 'vcm-upload-image-item__content']}>
															{
																isError
																	? <div style="padding: 5px">{t('vc.UploadPicker.failed')}</div>
																	: <Spin size={20} />
															}
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
