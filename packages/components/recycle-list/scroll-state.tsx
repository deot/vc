/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import { Customer } from '../customer';
import { Spin } from '../spin';

const COMPONENT_NAME = 'vc-recycle-list-scroll-state';

export const ScrollState = defineComponent({
	name: COMPONENT_NAME,
	setup(_, { slots }) {
		const instance = getInstance('recycle-list', 'recycleListId')!;
		const owner = instance.exposed;

		const current = ref();
		return () => {
			if (!owner) return null;
			return (
				<div ref={current} class="vc-recycle-list__scroll-state">
					{
						!owner.hasPlaceholder.value && !owner.store.states.isEnd && !owner.store.states.isSlientRefresh && (
							<div
								class="vc-recycle-list__loading"
								style={{ visibility: owner.store.states.isLoading ? 'visible' : 'hidden' }}
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
						owner.store.states.isEnd && (
							owner.store.states.data.length
								? (
										<div class="vc-recycle-list__complete">
											{
												slots.complete?.() || owner.renderer.value.complete
													? (<Customer render={owner.renderer.value.complete} />)
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
