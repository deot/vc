/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as uploadPickerProps, emits } from './upload-picker-props';
import { Upload } from '../upload/index';
import { SortList } from '../sort-list/index';
import { useUploadPicker } from './use-upload-picker';

export const UploadPicker = defineComponent({
	name: 'vc-upload-picker',
	props: uploadPickerProps,
	emits: [...emits],
	setup(props, context) {
		return useUploadPicker(props, context, { Upload, SortList });
	}
});
