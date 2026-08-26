/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { Icon } from '../../icon';
import { Progress } from '../../progress';
import { getAvailableIndex } from '../utils';

export const FileItem = defineComponent({
	name: 'vc-upload-picker-file-item',
	props: {
		fileClass: [String, Object, Array],
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
			const label = row[props.keyValue!.label] || row.name || value;
			const isError = row.status === 0 || !!row.errorFlag;
			const isReady = !isError && !!value;

			return (
				<div class={[{ 'is-error': isError }, 'vc-upload-picker-file-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										<div class={[props.fileClass, 'vc-upload-picker-file-item__content']}>
											{
												isError
													? <span>上传失败</span>
													: !isReady
															? (
																	<Progress
																		percent={row.percent || 0}
																		showText={false}
																		style="width: 100%; padding: 0 5px"
																	/>
																)
															: (
																	<Fragment>
																		<Icon type="file" class="vc-upload-picker-file-item__file-icon" />
																		<div title={label} class="vc-upload-picker-file-item__title">{label}</div>
																	</Fragment>
																)
											}
										</div>
										{
											(!props.disabled || isError) && (
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
