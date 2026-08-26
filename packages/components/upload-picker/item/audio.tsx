/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { Icon } from '../../icon';
import { Progress } from '../../progress';
import { AudioPreview } from '../preview/audio';
import { getAvailableIndex } from '../utils';

export const AudioItem = defineComponent({
	name: 'vc-upload-picker-audio-item',
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
		const current = computed(() => {
			return getAvailableIndex(props.row, props.data, props.index!, props.keyValue!.value);
		});

		return () => {
			const row = props.row;
			const value = row[props.keyValue!.value];
			const isError = row.status === 0 || !!row.errorFlag;
			return (
				<div class={[{ 'is-error': isError }, 'vc-upload-picker-audio-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										<div class={[props.audioClass, 'vc-upload-picker-audio-item__content']}>
											{
												!row.errorFlag && typeof value === 'string'
													? <audio src={value} preload="metadata" />
													: row.percent && Number(row.percent) !== 100
														? <Progress percent={row.percent} showText={false} style="width: 100%; padding: 0 5px" />
														: !value && row.percent === 100 && !row.errorFlag
																? <p style="line-height: 1; padding: 5px">服务器正在接收...</p>
																: isError
																	? <div style="padding: 5px">上传失败</div>
																	: null
											}
										</div>
										{
											typeof value === 'string' && !row.errorFlag && (
												<button
													type="button"
													aria-label="预览音频"
													class="vc-upload-picker-audio-item__play"
													onClick={() => AudioPreview.popup({ src: value })}
												>
													<span class="vc-upload-picker-audio-item__play-icon" />
												</button>
											)
										}
										{
											(!props.disabled || row.errorFlag) && (
												<Icon
													type="close-small"
													class="vc-upload-picker__delete"
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
