/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, inject, ref, computed, nextTick, watch, onMounted, onBeforeUnmount, withModifiers, toRaw } from 'vue';
import type { PropType } from 'vue';
import { raf, caf } from '@deot/helper-utils';
import type { TreeNode } from './store';
import { Checkbox } from '../checkbox';
import { Customer } from '../customer';
import { Spin } from '../spin';
import { Icon } from '../icon';
import { props as treeNodeProps } from './tree-node-content-props';
import type {
	TreeCurrentChangePayload,
	TreeNodeEventPayload,
	TreeProvide
} from './types';

const COMPONENT_NAME = 'vc-tree-node';

// 复选框上的点击不冒泡到行（行的点击会选中当前节点、按设置展开或勾选）
const stopClick = withModifiers(() => {}, ['stop']);

// 展开 / 收起动画的时长（ms），与 TransitionCollapse 的默认值一致
const DURATION = 300;
// 估算动画块可容纳的行数时，读不到行高的兜底（px）
const ROW_HEIGHT = 26;

/**
 * 按可见规则收集 node 之下的节点（未被过滤隐藏；展开的才下钻，正在动画的节点视为收起）
 * @param nodes 起点的子节点
 * @param motions 正在动画的节点
 * @param limit 最多收集的数量
 * @returns 节点列表
 */
export const collectVisibleNodes = (nodes: TreeNode[], motions: Map<TreeNode, unknown>, limit = Infinity) => {
	const result: TreeNode[] = [];
	const walk = (list: TreeNode[]) => {
		for (const node of list) {
			if (result.length >= limit) return;
			if (!node.states.visible) continue;
			result.push(node);
			node.states.expanded && !motions.has(node) && walk(node.childNodes);
		}
	};
	walk(nodes);
	return result;
};

/**
 * 展开 / 收起的动画块：节点正在展开或收起时，它的子孙不在铺平的列表里，而是在这里渲染，并在高度上过渡
 * 	- 展开：高度 0 → 内容高度；收起：内容高度 → 0；结束后移出动画，展开的子孙回到铺平的列表
 * 	- 只渲染可视范围能容纳的行数：子孙很多时也只多渲染一屏，超出部分在动画中本来就看不见
 * 	- 懒加载：展开时子节点尚未加载，等加载完成（节点变为展开）再开始；加载失败或没有子节点时直接结束
 */
const TreeNodeMotion = defineComponent({
	name: 'vc-tree-node-motion',
	props: {
		node: {
			type: Object as PropType<TreeNode>,
			required: true
		},
		direction: {
			type: String as PropType<'expand' | 'collapse'>,
			required: true
		}
	},
	setup(props) {
		const tree = inject<TreeProvide>('vc-tree')!;
		const el = ref<HTMLElement>();
		let timer: any;
		let frame: any;
		let started = false;

		// 可视范围能容纳的行数：所在 Scroller（如弹层）或窗口的高度 / 行高
		const getLimit = () => {
			const rootEl = tree.instance.vnode.el as HTMLElement | null;
			const rowHeight = (rootEl?.querySelector('.vc-tree-node__content') as HTMLElement | null)?.offsetHeight || ROW_HEIGHT;
			const viewport = (rootEl?.closest('.vc-scroller') as HTMLElement | null)?.clientHeight || window.innerHeight;
			return Math.ceil(viewport / rowHeight) + 1;
		};
		const limit = getLimit();

		const list = computed(() => {
			if (props.direction === 'expand' && !props.node.states.expanded) return [];
			return collectVisibleNodes(props.node.childNodes, tree.motions, limit);
		});

		const stop = () => {
			clearTimeout(timer);
			caf(frame);
		};

		const done = () => {
			stop();
			tree.motions.get(props.node) === props.direction && tree.motions.delete(props.node);
		};

		const start = () => {
			if (started || !el.value) return;
			// 展开时子节点还在加载
			if (!list.value.length) {
				(props.direction === 'collapse' || props.node.states.expanded) && done();
				return;
			}
			started = true;
			const target = el.value;
			const full = target.scrollHeight;
			const [from, to] = props.direction === 'expand' ? [0, full] : [full, 0];
			target.style.height = `${from}px`;
			// 起始高度渲染一帧后再设置过渡与目标高度：同一帧内回流后立即设置，Chrome 有时不开始过渡（与 Vue Transition 的 nextFrame 一致）
			frame = raf(() => {
				frame = raf(() => {
					target.style.transition = `height ${DURATION}ms ease-in-out`;
					target.style.height = `${to}px`;
				});
			});
			// 结束不依赖帧回调：页面在后台不渲染时也按时移出动画
			timer = setTimeout(done, DURATION + 50);
		};

		watch(() => list.value.length, () => nextTick(start));
		onMounted(start);
		onBeforeUnmount(stop);

		return () => {
			return (
				<div ref={el} class="vc-tree-node__motion" role="group">
					{ list.value.map(node => tree.renderNode(node)) }
				</div>
			);
		};
	}
});

/**
 * 树的一行：节点自身的内容；铺平渲染，子孙是列表里的其他行（展开 / 收起动画期间在行内的动画块中）
 */
export const TreeNodeContent = defineComponent({
	name: COMPONENT_NAME,
	props: treeNodeProps,
	setup(props) {
		const instance = getCurrentInstance()!;
		const tree = inject<TreeProvide>('vc-tree')!;

		// 行的根节点在组件生命周期内不变：挂载时登记即可
		onMounted(() => tree.registerRow(props.node, instance));
		onBeforeUnmount(() => tree.unregisterRow(props.node, instance));

		const handleCheckChange = (checked: boolean) => {
			tree.toggleCheck(props.node, checked);
		};

		// 复选框不单独占用 Tab：键盘焦点在行上，空格 / 回车切换勾选
		const handleCheckboxMounted = (vnode: any) => {
			vnode.el?.querySelector?.('input')?.setAttribute('tabindex', '-1');
		};

		// 节点事件（node-click / node-contextmenu）的参数
		const toNodePayload = (e: Event): TreeNodeEventPayload => ({
			node: props.node,
			data: props.node.states.data,
			instance,
			event: e
		});

		const handleExpandIconClick = () => {
			tree.toggle(props.node, instance);
		};

		const handleClick = (e: Event) => {
			const store = tree.store;
			const oldNode = store.currentNode;
			store.setCurrentNode(props.node);
			// 当前节点不变时不发出
			if (toRaw(store.currentNode) !== toRaw(oldNode)) {
				tree.emit('current-change', {
					node: store.currentNode!,
					data: store.currentNode!.states.data,
					oldNode
				} satisfies TreeCurrentChangePayload);
			}

			if (tree.props.expandOnClickNode) {
				handleExpandIconClick();
			}
			// 禁用的节点由 toggleCheck 忽略
			tree.props.checkOnClickNode && tree.toggleCheck(props.node);
			tree.emit('node-click', toNodePayload(e));
		};

		const handleRowClick = withModifiers(handleClick, ['stop']);
		const handleIconClick = withModifiers(handleExpandIconClick, ['stop']);

		const handleContextMenu = (e: any) => {
			if (tree.instance.vnode.props!['onNodeContextmenu']) {
				e.stopPropagation();
				e.preventDefault();
			}
			tree.emit('node-contextmenu', toNodePayload(e));
		};

		return () => {
			const { node } = props;
			const { expanded, isLeaf } = node.states;
			const disabled = !!node.getter.disabled;
			const { showCheckbox, renderNodeLabel } = tree.props;
			const motion = tree.motions.get(node);
			return (
				<div
					class={[
						{
							'is-expanded': expanded,
							'is-current': node.states.isCurrent,
							'is-focusable': !disabled,
							'is-checked': !disabled && node.states.checked
						},
						'vc-tree-node'
					]}
					aria-expanded={isLeaf ? void 0 : expanded}
					aria-level={node.states.level}
					aria-disabled={disabled}
					aria-checked={node.states.checked}
					role="treeitem"
					tabindex="-1"
					onClick={handleRowClick}
					onContextmenu={handleContextMenu}
				>
					<div
						style={[{ 'padding-left': (node.states.level - 1) * tree.props.indent + 'px' }]}
						class="vc-tree-node__content"
					>
						<span
							class={[
								{
									'is-expand': !isLeaf && expanded,
									'is-leaf': isLeaf
								},
								// 从展开图标按下不发起拖拽
								'vc-tree-node__expand-icon vc-drag-ignore'
							]}
							onClick={handleIconClick}
						>
							{
								// 叶子节点的图标不可见（is-leaf 透明），只为占位：用与 Icon 相同结构的静态元素，不为每片叶子建组件
								isLeaf
									? (<i class="vc-icon"><svg xmlns="http://www.w3.org/2000/svg" /></i>)
									: (<Icon type="triangle-up" />)
							}
						</span>
						{
							showCheckbox && (
								<Checkbox
									modelValue={node.states.checked}
									indeterminate={node.states.indeterminate}
									disabled={disabled}
									onChange={handleCheckChange}
									// @ts-ignore
									onClick={stopClick}
									onVnodeMounted={handleCheckboxMounted}
								/>
							)
						}

						{
							node.states.loading && (
								<Spin
									size={12}
									class="vc-tree-node__loading-icon"
								/>
							)
						}

						{
							renderNodeLabel
								? (<Customer render={renderNodeLabel} store={node} row={node.states.data} />)
								: <span class="vc-tree-node__label">{node.getter.label}</span>
						}
					</div>
					{ motion && (<TreeNodeMotion key={motion} node={node} direction={motion} />) }
				</div>
			);
		};
	}
});
