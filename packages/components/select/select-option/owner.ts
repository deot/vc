import type { Ref } from 'vue';

export const OPTION_OWNER_KEY = 'vc-select-option-owner';

/**
 * 选项所属的列表（由 Select、联想组件 provide）：选项据此判断是否已选中，点击时交给它处理
 * 	- current：已选中的值；没有选中态（联想组件）时不提供
 * 	- multiple：是否多选（多选时只有最后选中的一项带 is-last）
 * 	- pick：点击选项，参数为选项的值与它的数据
 */
export interface OptionOwner {
	current?: Ref<any[]>;
	multiple?: Ref<boolean>;
	pick: (value: any, row?: any) => void;
}
