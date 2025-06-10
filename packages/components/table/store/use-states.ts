import { computed, inject, reactive } from 'vue';
import type { Store } from './store';

type Mapper = {
	[key: string]: ((states: Store['states']) => any) | string;
};
export const useStates = (mapper: Mapper, $store?: Store) => {
	const store = $store || inject<any>('vc-table')?.store;

	// computedRef自动解包
	const states = reactive({});
	Object.keys(mapper).forEach((key) => {
		const value = mapper[key];
		if (typeof value === 'string') {
			states[key] = computed(() => {
				return store.states[value];
			});
		} else if (typeof value === 'function') {
			states[key] = computed(() => {
				return value(store.states);
			});
		} else {
			console.error('invalid value type');
		}
	});

	return states;
};
