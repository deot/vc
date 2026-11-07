/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { MButton } from '../../button/index.m';
import { useLocale } from '../../locale';
import { props as paginationProps } from './pagination-props';

const COMPONENT_NAME = 'vcm-pagination';

/**
 * 移动端分页：上一页、页码、下一页三段，页码始终居中；尺寸随 --vc-rem 缩放（750 稿）
 */
export const MPagination = defineComponent({
	name: COMPONENT_NAME,
	props: paginationProps,
	emits: ['update:current', 'change'],
	setup(props, { emit, slots, expose }) {
		const { t } = useLocale();
		const currentPage = ref(props.current);

		const total = computed(() => Math.max(1, Math.ceil(props.count / props.pageSize)));
		const isFirst = computed(() => currentPage.value <= 1);
		const isLast = computed(() => currentPage.value >= total.value);

		watch(() => props.current, (v) => {
			currentPage.value = v;
		});

		// 总数减少导致当前页越界时，退到新的末页（不触发事件，与桌面端一致）
		watch(total, (v) => {
			if (currentPage.value > v) {
				currentPage.value = v;
			}
		});

		const resetPage = (page: number) => {
			if (currentPage.value === page) return;
			currentPage.value = page;
			emit('update:current', page);
			emit('change', page);
		};

		const previous = () => {
			if (isFirst.value) return false;
			resetPage(currentPage.value - 1);
		};

		const next = () => {
			if (isLast.value) return false;
			resetPage(currentPage.value + 1);
		};

		expose({
			previous,
			next,
			resetPage
		});

		const renderField = (direction: 'previous' | 'next') => {
			const isPrevious = direction === 'previous';
			const disabled = isPrevious ? isFirst.value : isLast.value;
			const slot = slots[direction];
			const content = slot
				? slot({
						current: currentPage.value,
						total: total.value,
						disabled,
						[direction]: isPrevious ? previous : next
					})
				: (() => {
						const text = isPrevious
							? (props.previousText ?? t('vc.Pagination.previousPage'))
							: (props.nextText ?? t('vc.Pagination.nextPage'));
						const type = props.type === 'text'
							? 'text'
							: (!isPrevious && props.nextType === 'primary' ? 'primary' : 'default');
						// 图标与间距、只有图标时的方形按钮都交给 MButton；下一页的图标由样式移到文字之后
						// MButton 的 is-alone 按挂载时有无默认插槽计算，文字有无变化时用 key 重建
						return (
							<MButton
								key={text ? 'text' : 'alone'}
								type={type}
								icon={props.icon ? (isPrevious ? 'left' : 'right') : undefined}
								disabled={disabled}
								wait={0}
								onClick={isPrevious ? previous : next}
								v-slots={text ? { default: () => text } : undefined}
							/>
						);
					})();

			return (
				<div class={`${COMPONENT_NAME}__${direction}`}>
					{content}
				</div>
			);
		};

		return () => {
			if (props.hideOnSinglePage && total.value <= 1) return null;

			const hasField = props.type !== 'simple';
			return (
				<div
					class={[
						COMPONENT_NAME,
						`is-${props.type}`,
						`is-${props.justify}`,
						{ 'is-next-primary': props.nextType === 'primary' }
					]}
				>
					{hasField && renderField('previous')}
					<div class={`${COMPONENT_NAME}__page`}>
						{
							slots.default
								? slots.default({ current: currentPage.value, total: total.value })
								: `${currentPage.value} / ${total.value}`
						}
					</div>
					{hasField && renderField('next')}
				</div>
			);
		};
	}
});
