/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { getInstance } from '@deot/vc-hooks';
import { Customer } from '../customer';
import { Spin } from '../spin';

const COMPONENT_NAME = 'vc-recycle-list-scroll-state';

export const ScrollState = defineComponent({
	name: COMPONENT_NAME,
	emits: ['resize'],
	setup(_, { emit, slots }) {
		const instance = getInstance('recycle-list', 'recycleListId')!;
		const owner = instance.exposed;

		const current = ref();
		const offsetHeight = ref(0);

		const handleResize = () => {
			const v = current.value.offsetHeight;
			const changed = offsetHeight.value != v;
			if (changed) {
				offsetHeight.value = v;
				emit('resize');
			}
		};

		onMounted(() => {
			offsetHeight.value = current.value.offsetHeight;
			Resize.on(current.value, handleResize);
		});

		onBeforeUnmount(() => {
			Resize.off(current.value, handleResize);
		});

		return () => {
			if (!owner) return null;
			return (
				<div ref={current} class="vc-recycle-list__scroll-state">
					{
						!owner.hasPlaceholder.value && !owner.isEnd.value && !owner.isSlientRefresh.value && (
							<div
								class="vc-recycle-list__loading"
								style={{ visibility: owner.isLoading ? 'visible' : 'hidden' }}
							>
								{
									slots.loading?.() || (
										owner.renderer.value.loading
											? (<Customer render={owner.renderer.value.loading} />)
											: (
												<div class="vc-recycle-list__center">
													<Spin size={20} />
												</div>
												)
									)
								}
							</div>
						)
					}
					{
						owner.isEnd.value && (
							owner.data.length
								? (
									<div class="vc-recycle-list__finish">
										{
											slots.finish?.() || owner.renderer.value.finish
												? (<Customer render={owner.renderer.value.finish} />)
												: (<div class="vc-recycle-list__center">已全部加载~</div>)
										}
									</div>
									)
								: (
									<div
										class="vc-recycle-list__empty"
									>
										{
											slots.empty?.() || owner.renderer.value.empty
												? (<Customer render={owner.renderer.value.empty} />)
												: (<div class="vc-recycle-list__center">暂无数据~</div>)
										}
									</div>
									)
						)
					}
				</div>
			);
		};
	}
});
