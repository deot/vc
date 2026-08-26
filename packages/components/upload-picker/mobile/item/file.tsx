/** @jsxImportSource vue */

import { computed, defineComponent, Fragment } from 'vue';
import { Icon } from '../../../icon';
import { Spin } from '../../../spin';
import { getAvailableIndex } from '../../utils';

export const MFileItem = defineComponent({
	name: 'vcm-upload-picker-file-item',
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
			return (
				<div class={[{ 'is-error': isError }, 'vcm-upload-picker-file-item']}>
					{
						slots.default
							? slots.default({ row, index: props.index, current: current.value })
							: (
									<Fragment>
										<div class={[props.fileClass, 'vcm-upload-picker-file-item__content']}>
											{
												isError
													? <span>上传失败</span>
													: !value
															? <Spin size={20} />
															: (
																	<Fragment>
																		<Icon type="file" class="vcm-upload-picker-file-item__file-icon" />
																		<div title={label} class="vcm-upload-picker-file-item__title">{label}</div>
																	</Fragment>
																)
											}
										</div>
										{
											(!props.disabled || isError) && (
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
