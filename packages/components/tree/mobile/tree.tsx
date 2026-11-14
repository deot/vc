import { defineComponent } from 'vue';
import { emits as treeEmits } from '../tree-props';
import { props as treeProps } from './tree-props';
import { useTree } from '../hooks/use-tree';
import type { TreeComponents } from '../types';
import { MCheckbox } from '../../checkbox/index.m';
import { MRecycleList } from '../../recycle-list/index.m';
import { MSpin } from '../../spin/index.m';

const COMPONENT_NAME = 'vcm-tree';

const components = {
	Checkbox: MCheckbox,
	RecycleList: MRecycleList,
	Spin: MSpin
} as unknown as TreeComponents;

/**
 * 移动端树：同 Tree，根节点另有标记类 vcm-tree，尺寸随 --vc-rem 缩放（750 稿）
 * 1. 数字 indent 为 750 稿长度，默认 32（375 宽下每级 16px）
 * 2. 内部的多选框、加载图标、虚拟列表为移动端的版本：virtualized 时使用原生滚动与系统滚动条
 * 3. 触屏交互：节点文字单行省略；按下有反馈，点按后不残留悬停 / 聚焦的底色；draggable 时长按节点发起拖拽
 */
export const MTree = defineComponent({
	name: COMPONENT_NAME,
	props: treeProps,
	emits: [...treeEmits],
	setup(props, context) {
		return useTree(props, context, { mobile: true, components });
	}
});
