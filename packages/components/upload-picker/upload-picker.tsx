/** @jsxImportSource vue */

import { defineComponent, computed, getCurrentInstance, Fragment } from 'vue';

import { props as uploadPickerProps } from './upload-picker-props';
import { VcInstance } from '../vc';

import { Upload } from '../upload/index';
import { Icon } from '../icon/index';
// import SortList from '../sort-list/index';
import { ImageItem } from './item/image';
// import { VideoItem } from './item/video-item';
// import { AudioItem } from './item/audio-item';
// import { FileItem } from './item/file-item';
import { usePicker } from './use-picker';

const COMPONENT_NAME = 'vc-upload-picker';

export const UploadPicker = defineComponent({
	name: COMPONENT_NAME,
	props: uploadPickerProps,
	emits: [
		'update:modelValue',
		'file-success',
		'file-start',
		'file-before',
		'file-error',
		'success',
		'error',
		'complete',
		'change',
		'remove-before'
	],
	setup(props, { slots, expose }) {
		const instance = getCurrentInstance()!;
		const currentPicker = computed(() => {
			return props.picker.reduce((pre: any[], cur) => {
				switch (cur) {
					case 'image':
						pre.push({
							type: cur,
							item: ImageItem
						});
						return pre;
					case 'video':
						pre.push({
							type: cur,
							item: 'div'
							// item: VideoItem
						});
						return pre;
					case 'audio':
						pre.push({
							type: cur,
							item: 'div'
							// item: AudioItem
						});
						return pre;
					case 'file':
						pre.push({
							type: cur,
							item: 'div'
							// item: FileItem
						});
						return pre;
					default:
						return pre;
				}
			}, []);
		});
		const handleClick = (e, type) => {
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
							return (
								<Fragment key={`${picker}-${$index}`}>
									{
										base.currentValue.value[picker.type].map((item, index) => {
											const Item = picker.item;
											return (
												<Item
													key={typeof item === 'object' ? item.uid : item}
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
													onDelete={() => base.handleDelete(index, picker.type)}
												>
													{{
														default: slots.default
															? (scopeData: any) => {
																	return slots?.default?.({
																		row: item,
																		type: picker.type,
																		index: (scopeData)?.index,
																		// 当前分类的index
																		_index: index
																	});
																}
															: null
													}}
												</Item>
											);
										})
									}
									<Upload
										v-show={!props.disabled && base.dynamicMax.value[picker.type] >= 1}
										{
											...base.currentUploadOptions.value[picker.type]
										}
										max={base.dynamicMax[picker.type]}
										class="vc-upload-picker__upload"
										onFileBefore={(vFile, fileList) => base.handleFileBefore(vFile, fileList, picker.type)}
										onFileStart={vFile => base.handleFileStart(vFile, picker.type)}
										onFileProgress={(e, vFile) => base.handleFileProgress(e, vFile, picker.type)}
										onFileSuccess={(response, vFile, cycle) => base.handleFileSuccess(response, vFile, cycle, picker.type)}
										onFileError={(response, vFile, cycle) => base.handleFileError(response, vFile, cycle, picker.type)}
										onError={e => base.handleError(e, picker.type)}
										onComplete={response => base.handleFileComplete(response, picker.type)}
									>
										{
											slots?.[`${picker.type}-upload`]
												? slots[`${picker.type}-upload`]?.()
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
