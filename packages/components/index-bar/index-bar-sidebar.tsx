/** @jsxImportSource vue */

import { defineComponent, ref, computed } from 'vue';
import type { PropType } from 'vue';
import { useDrag } from '@deot/vc-hooks';
import type { DragPoint } from '@deot/vc-hooks';
import type { IndexBarGroup, IndexBarValue } from './index-bar-props';

/**
 * 索引侧栏（内部组件）：按下、拖动时按指针位置选组，不依赖 elementFromPoint
 *
 * 按下时量一次列表，之后只按 (y - top) / 单项高 取下标：每项等高（同一套样式），移动过程中不再读 DOM；
 * 根节点是铺满可见段的一层（不接收指针），列表靠右垂直居中，提示以这一层为参照定位
 */
export const IndexBarSidebar = defineComponent({
	name: 'vc-index-bar-sidebar',
	props: {
		data: {
			type: Array as PropType<IndexBarGroup[]>,
			default: () => ([])
		},
		modelValue: {
			type: [String, Number] as PropType<IndexBarValue>
		},
		tip: {
			type: Boolean,
			default: true
		}
	},
	emits: ['select', 'dragstart', 'dragend'],
	setup(props, { emit, slots }) {
		const layer = ref<HTMLElement>();
		const list = ref<HTMLElement>();
		const dragging = ref(false);
		// 提示的纵向位置（相对这一层，CSS px）：当前项的中线
		const tipY = ref(0);

		const activeGroup = computed(() => props.data.find(group => group.value === props.modelValue));

		// 按下时的测量，拖动过程中复用
		let measure = { top: 0, layerTop: 0, itemSize: 0, scale: 1 };
		let lastIndex = -1;

		const pick = (point: DragPoint) => {
			const count = props.data.length;
			if (!count || !measure.itemSize) return;
			const index = Math.min(count - 1, Math.max(0, Math.floor((point.clientY - measure.top) / measure.itemSize)));
			tipY.value = (measure.top - measure.layerTop + (index + 0.5) * measure.itemSize) / measure.scale;
			if (index === lastIndex) return;
			lastIndex = index;
			emit('select', props.data[index].value, index);
		};

		const finish = () => {
			if (!dragging.value) return;
			dragging.value = false;
			lastIndex = -1;
			emit('dragend');
		};

		const { listeners } = useDrag({
			selectable: false,
			start: (_, point) => {
				const el = list.value;
				if (!el || !props.data.length) return false;
				const rect = el.getBoundingClientRect();
				const scale = (el.offsetHeight && rect.height / el.offsetHeight) || 1;
				measure = {
					top: rect.top,
					layerTop: layer.value!.getBoundingClientRect().top,
					itemSize: rect.height / props.data.length,
					scale
				};
				lastIndex = -1;
				dragging.value = true;
				emit('dragstart');
				pick(point);
			},
			move: (e, point) => {
				// 拖动侧栏时页面不跟着滚
				e.cancelable && e.preventDefault();
				pick(point);
			},
			end: finish,
			cancel: finish
		});

		return () => {
			const group = activeGroup.value;
			return (
				<div ref={layer} class={['vc-index-bar__sidebar', { 'is-dragging': dragging.value }]}>
					<div ref={list} class="vc-index-bar__sidebar-list" {...listeners}>
						{
							props.data.map((it) => {
								const active = it.value === props.modelValue;
								return (
									<div key={it.value} class={['vc-index-bar__sidebar-item', { 'is-active': active }]}>
										{ slots.item ? slots.item({ group: it, active }) : it.value }
									</div>
								);
							})
						}
					</div>
					{
						props.tip && dragging.value && group && (
							<div class="vc-index-bar__tip" style={{ '--vc-index-bar-tip-y': `${tipY.value}px` }}>
								{ slots.tip ? slots.tip({ group }) : group.value }
							</div>
						)
					}
				</div>
			);
		};
	}
});
