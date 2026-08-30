/** @jsxImportSource vue */

import { defineComponent, computed, getCurrentInstance, Fragment } from 'vue';

import { props as uploadPickerProps } from './upload-picker-props';
import { VcInstance } from '../vc';

import { Upload } from '../upload/index';
import { Icon } from '../icon/index';
import { ImageItem } from './item/image';
import { VideoItem } from './item/video';
import { AudioItem } from './item/audio';
import { FileItem } from './item/file';
import { usePicker } from './use-picker';
import type { PickerItem, PickerType } from './types';
import { SortList } from '../sort-list';
import { PICKER_ITEM_KEY } from './utils';

export const UploadPicker = defineComponent({
	name: 'vc-upload-picker',
	props: uploadPickerProps,
	emits: [
		'update:modelValue',
		'file-success',
		'file-start',
		'file-before',
		'file-error',
		'error',
		'complete',
		'change',
		'remove-before'
	],
	setup(props, { slots, expose }) {
		const instance = getCurrentInstance()!;
		const itemMap = {
			image: ImageItem,
			video: VideoItem,
			audio: AudioItem,
			file: FileItem
		};
		const currentPicker = computed(() => {
			return props.picker
				.map(type => ({ type, item: itemMap[type] }))
				.filter(picker => !!picker.item);
		});
		const handleClick = (e: MouseEvent, type: PickerType) => {
			const options = VcInstance.options.UploadPicker || {};
			if (typeof props.enhancer === 'function' || (props.enhancer && options.enhancer)) {
				const fn = typeof props.enhancer === 'function'
					? props.enhancer
					: options.enhancer;

				// 阻止原生事件，如video, file不走enhancer, 可以跳过;
				fn(instance, type) && e.stopPropagation();
			}
		};
		const base = usePicker(expose);
		return () => {
			return (
				<div class="vc-upload-picker">
					{
						currentPicker.value.map((picker, $index) => {
							const renderItem = (item: PickerItem, index: number) => {
								const Item: any = picker.item;
								return (
									<Item
										key={item[PICKER_ITEM_KEY]}
										row={item}
										disabled={props.disabled}
										image-preview-options={props.imagePreviewOptions}
										imageClass={props.imageClass}
										videoClass={props.videoClass}
										audioClass={props.audioClass}
										fileClass={props.fileClass}
										index={index}
										keyValue={props.keyValue}
										data={base.currentValue.value[picker.type]}
										class="vc-upload-picker__item"
										onRemove={() => base.handleRemove(index, picker.type)}
									>
										{{
											default: slots.default
												? (scopeData: any) => slots.default?.({
														row: item,
														type: picker.type,
														// 过滤上传失败项后的可预览列表索引
														index: scopeData?.current,
														// 当前文件类型数组中的原始索引
														typeIndex: index
													})
												: null
										}}
									</Item>
								);
							};
							return (
								<Fragment key={`${picker.type}-${$index}`}>
									{
										props.sortable
											? (
													<SortList
														modelValue={base.currentValue.value[picker.type]}
														primaryKey={PICKER_ITEM_KEY}
														mask={props.mask}
														onChange={(value: PickerItem[]) => base.handleSortChange(value, picker.type)}
													>
														{({ row, index }) => renderItem(row, index)}
													</SortList>
												)
											: base.currentValue.value[picker.type].map(renderItem)
									}
									<Upload
										v-show={!props.disabled && base.dynamicMax.value[picker.type] >= 1}
										{
											...base.currentUploadOptions.value[picker.type]
										}
										max={base.dynamicMax.value[picker.type]}
										class="vc-upload-picker__upload"
										// @ts-ignore
										onFileBefore={payload => base.handleFileBefore(payload, picker.type)}
										onFileStart={payload => base.handleFileStart(payload, picker.type)}
										onFileProgress={payload => base.handleFileProgress(payload, picker.type)}
										onFileSuccess={payload => base.handleFileSuccess(payload, picker.type)}
										onFileError={payload => base.handleFileError(payload, picker.type)}
										onError={payload => base.handleError(payload, picker.type)}
										onComplete={payload => base.handleFileComplete(payload, picker.type)}
									>
										{
											slots.upload
												? slots.upload({ type: picker.type })
												: (
														<div
															class={[props.boxClass, 'vc-upload-picker__box']}
															onClick={e => handleClick(e, picker.type)}
														>
															<Icon type="mini-plus" class="vc-upload-picker__plus-icon" />
															<span style="margin-top: 8px">上传</span>
														</div>
													)
										}
									</Upload>
								</Fragment>
							);
						})
					}
				</div>
			);
		};
	}
});
