/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { MUpload } from '../../upload/index.m';
import { MSortList } from '../../sort-list/index.m';
import { MActionSheet } from '../../action-sheet/index.m';
import { useLocale } from '../../locale';
import { props as uploadPickerProps, emits } from '../upload-picker-props';
import { useUploadPicker } from '../use-upload-picker';

export const MUploadPicker = defineComponent({
	name: 'vcm-upload-picker',
	props: uploadPickerProps,
	emits: [...emits],
	setup(props, context) {
		const { t } = useLocale();
		return useUploadPicker(props, context, {
			mobile: true,
			Upload: MUpload,
			SortList: MSortList,
			// 多种类型时先选类型：保留各类型原生选择的相册、拍照与 capture；选项的点击在同一次点按里打开原生选择
			choose: (types, pick) => {
				MActionSheet.open({
					cancelText: t('vc.UploadPicker.cancel'),
					data: types.map(type => ({
						content: t(`vc.UploadPicker.${type}`),
						onClick: () => pick(type)
					}))
				});
			}
		});
	}
});
