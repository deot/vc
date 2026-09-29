/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { useLocale } from '../../../locale';
import { Icon } from '../../../icon';
import { Spin } from '../../../spin';
import { AudioPreview } from '../../../file-preview/preview/audio';
import { getAvailableIndex } from '../../utils';

export const MAudioItem = defineComponent({
	name: 'vcm-upload-picker-audio-item',
	props: {
		audioClass: [String, Object, Array],
		disabled: Boolean,
		row: { type: Object, default: () => ({}) },
		index: [String, Number],
		data: { type: Array, default: () => ([]) },
		keyValue: Object
	},
	emits: ['remove'],
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
				<div class={[{ 'is-error': isError }, 'vcm-upload-picker-audio-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										<div class={[props.audioClass, 'vcm-upload-picker-audio-item__content']}>
											{
												typeof value === 'string' && !row.errorFlag
													? <audio src={value} preload="metadata" />
													: isError
														? <div style="padding: 5px">{t('vc.UploadPicker.failed')}</div>
														: <Spin size={20} />
											}
										</div>
										{
											typeof value === 'string' && !row.errorFlag && (
												<button
													type="button"
													aria-label={t('vc.UploadPicker.previewAudio')}
													class="vcm-upload-picker-audio-item__play"
													onClick={() => AudioPreview.popup({ src: value })}
												>
													<span class="vcm-upload-picker-audio-item__play-icon" />
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
