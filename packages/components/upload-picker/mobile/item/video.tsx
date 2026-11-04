/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { useLocale } from '../../../locale';
import { Icon } from '../../../icon';
import { MSpin } from '../../../spin/index.m';
import { getAvailableIndex } from '../../utils';

export const MVideoItem = defineComponent({
	name: 'vcm-upload-picker-video-item',
	props: {
		videoClass: [String, Object, Array],
		disabled: Boolean,
		row: { type: Object, default: () => ({}) },
		index: [String, Number],
		data: { type: Array, default: () => ([]) },
		keyValue: Object
	},
	emits: ['preview', 'remove'],
	setup(props, { emit, slots }) {
		const { t } = useLocale();
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});
		return () => {
			const row = props.row;
			const value = row[props.keyValue!.value];
			const isError = row.status === 0 || !!row.errorFlag;
			return (
				<div class={[{ 'is-error': isError }, 'vcm-upload-picker-video-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										<div class={[props.videoClass, 'vcm-upload-picker-video-item__content']}>
											{
												typeof value === 'string' && !row.errorFlag
													? <video src={value} preload="metadata" playsinline />
													: isError
														? <div class="vcm-upload-picker-video-item__failed">{t('vc.UploadPicker.failed')}</div>
														: <MSpin size={40} />
											}
										</div>
										{
											typeof value === 'string' && !row.errorFlag && (
												<button
													type="button"
													aria-label={t('vc.UploadPicker.previewVideo')}
													class="vcm-upload-picker-video-item__play"
													onClick={() => emit('preview')}
												>
													<span class="vcm-upload-picker-video-item__play-icon" />
												</button>
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
