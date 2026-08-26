/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { Icon } from '../../../icon';
import { Spin } from '../../../spin';
import { VideoPreview } from '../../preview/video';
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
														? <div style="padding: 5px">上传失败</div>
														: <Spin size={20} />
											}
										</div>
										{
											typeof value === 'string' && !row.errorFlag && (
												<button
													type="button"
													aria-label="预览视频"
													class="vcm-upload-picker-video-item__play"
													onClick={() => VideoPreview.popup({ src: value })}
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
