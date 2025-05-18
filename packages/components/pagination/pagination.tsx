/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { props as pageProps } from './pagination-props';
import { Icon } from '../icon/index';
import { Select } from '../select/index';
import { InputNumber } from '../input/index';

const COMPONENT_NAME = 'vc-pagination';

export const Pagination = defineComponent({
	name: COMPONENT_NAME,
	props: pageProps,
	emits: ['update:current', 'change', 'page-size-change'],
	setup(props, { emit, slots, expose }) {
		const hackPage = ref(props.current);
		const currentPage = ref();
		const currentPageSize = ref();

		const totalPage = computed(() => {
			const v = Math.ceil(props.count / currentPageSize.value);
			return (v === 0) ? 1 : v;
		});

		watch(
			() => props.current,
			(v) => {
				currentPage.value = v;
			},
			{ immediate: true }
		);

		watch(
			() => props.pageSize,
			(v) => {
				currentPageSize.value = v;
			},
			{ immediate: true }
		);

		watch(
			() => props.count,
			(v) => {
				const maxPage = Math.ceil(v / currentPageSize.value);
				if (maxPage < currentPage.value) {
					currentPage.value = (maxPage === 0 ? 1 : maxPage);
				}
			}
		);

		const resetPage = (page) => {
			if (currentPage.value != page) {
				currentPage.value = page;
				emit('update:current', page);
				emit('change', page);
			}
		};

		const prev = () => {
			const current = currentPage.value;
			if (current <= 1) {
				return false;
			}
			resetPage(current - 1);
		};

		const next = () => {
			const current = currentPage.value;
			if (current >= totalPage.value) {
				return false;
			}
			resetPage(current + 1);
		};

		const handleFastPre = () => {
			const page = currentPage.value - 5;
			if (page > 0) {
				resetPage(page);
			} else {
				resetPage(1);
			}
		};

		const handleFastNext = () => {
			const page = currentPage.value + 5;
			if (page > totalPage.value) {
				resetPage(totalPage.value);
			} else {
				resetPage(page);
			}
		};

		const resetPageSize = (pageSize: number) => {
			currentPageSize.value = pageSize;

			emit('page-size-change', pageSize);

			// 切换条数时，强制为第一页
			hackPage.value = totalPage.value < currentPage.value ? totalPage.value : currentPage.value;
			currentPage.value = 1;
		};

		const handleInput = (v: number) => {
			hackPage.value = v > totalPage.value ? totalPage.value : v;
		};

		const handleEnter = () => {
			resetPage(Number(hackPage.value));
		};

		expose({
			prev,
			next,
			resetPage
		});
		return () => {
			return (
				<div class="vc-pagination">
					{
						props.showCount && (
							<span class="vc-pagination__count">
								{
									slots.default
										? slots.default()
										: (
												<span>
													<span>共</span>
													<span style="padding: 0 5px">{props.count}</span>
													<span>条</span>
												</span>
											)
								}
							</span>
						)
					}
					<div
						class={[{ 'is-disabled': currentPage.value == 1 }, 'vc-pagination__item is-icon']}
						title="prev"
						onClick={prev}
					>
						<Icon type="left" />
					</div>
					{ /* 第一页 */ }
					<div
						class={[{ 'is-active': currentPage.value == 1 }, 'vc-pagination__item']}
						title="1"
						onClick={() => resetPage(1)}
					>
						<span>1</span>
					</div>
					{
						currentPage.value > 5 && (
							<div
								title="向前 5 页"
								class="vc-pagination__item is-jump"
								onClick={handleFastPre}
							>
								...
							</div>
						)
					}

					{
						currentPage.value === 5 && (
							<div
								title={`${currentPage.value - 3}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value - 3)}
							>
								<span>{currentPage.value - 3}</span>
							</div>
						)
					}

					{
						currentPage.value - 2 > 1 && (
							<div
								title={`${currentPage.value - 2}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value - 2)}
							>
								<span>{currentPage.value - 2}</span>
							</div>
						)
					}

					{
						currentPage.value - 1 > 1 && (
							<div
								title={`${currentPage.value - 1}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value - 1)}
							>
								<span>{currentPage.value - 1}</span>
							</div>
						)
					}

					{/* 当前页 */}

					{
						currentPage.value != 1 && currentPage.value != totalPage.value && (
							<div
								title={`${currentPage.value}`}
								class="vc-pagination__item is-active"
							>
								<span>{currentPage.value}</span>
							</div>
						)
					}

					{/* 分割线 */}

					{
						currentPage.value + 1 < totalPage.value && (
							<div
								title={`${currentPage.value + 1}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value + 1)}
							>
								<span>{currentPage.value + 1}</span>
							</div>
						)
					}

					{
						currentPage.value + 2 < totalPage.value && (
							<div
								title={`${currentPage.value + 2}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value + 2)}
							>
								<span>{currentPage.value + 2}</span>
							</div>
						)
					}

					{
						totalPage.value - currentPage.value === 4 && (
							<div
								title={`${currentPage.value + 3}`}
								class="vc-pagination__item"
								onClick={() => resetPage(currentPage.value + 3)}
							>
								<span>{currentPage.value + 3}</span>
							</div>
						)
					}

					{
						totalPage.value - currentPage.value >= 5 && (
							<div
								title="向后 5 页"
								class="vc-pagination__item is-jump"
								onClick={handleFastNext}
							>
								...
							</div>
						)
					}

					{
						totalPage.value > 1 && (
							<div
								title={`${totalPage.value}`}
								class={[{ 'is-active': currentPage.value == totalPage.value }, 'vc-pagination__item']}
								onClick={() => resetPage(totalPage.value)}
							>
								<span>{totalPage.value}</span>
							</div>
						)
					}

					<div
						class={[{ 'is-disabled': currentPage == totalPage }, 'vc-pagination__item is-icon']}
						title="next"
						onClick={next}
					>
						<Icon type="right" />
					</div>

					{
						(props.showSizer || props.showElevator) && (
							<div class="vc-pagination__size">
								{
									props.showSizer && (
										<div>
											<Select
												// @ts-ignore
												modelValue={currentPageSize.value}
												placement={props.placement}
												portal={props.portal}
												extra={`${currentPageSize.value} 条/页`}
												style="width: 90px; margin-right: 10px;"
												data={props.pageSizeOptions.map(i => ({ value: i, label: `${i} 条/页` }))}
												onChange={resetPageSize}
											/>
										</div>
									)
								}

								{
									props.showElevator && (
										<div class="vc-pagination__elevator">
											<span>跳至</span>
											<InputNumber
												modelValue={hackPage.value}
												step={0}
												min={1}
												max={totalPage.value}
												style="width: 50px; margin-right: 10px; margin-left: 10px;"
												// @ts-ignore
												spellcheck={false}
												autocomplete="off"
												onInput={handleInput}
												onEnter={handleEnter}
											/>
											<span>页</span>
										</div>
									)
								}
							</div>
						)
					}
				</div>
			);
		};
	}
});
