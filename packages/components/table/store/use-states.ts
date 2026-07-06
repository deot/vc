import { computed, inject, reactive } from 'vue';
import type { UnwrapRef } from 'vue';
import type { TableProvide } from '../types';
import type { Store } from './store';

type StoreStates = InstanceType<typeof Store>['states'];
type StoreStateKey = keyof StoreStates;

type UseStatesMapper = Record<
	string,
	StoreStateKey | ((states: StoreStates) => unknown)
>;

type ResolveMapperEntry<V>
	= V extends StoreStateKey ? UnwrapRef<StoreStates[V]>
		: V extends (states: StoreStates) => infer R ? R
			: never;

type UseStatesResult<M extends UseStatesMapper> = {
	[K in keyof M]: ResolveMapperEntry<M[K]>;
};

export const useStates = <M extends UseStatesMapper>(
	mapper: M,
	$store?: Store
): UseStatesResult<M> => {
	const store = $store || inject<TableProvide>('vc-table')!.store;

	// computedRef自动解包
	const states = {} as UseStatesResult<M>;
	Object.keys(mapper).forEach((key) => {
		const value = mapper[key];
		if (typeof value === 'string') {
			(states as Record<string, unknown>)[key] = computed(() => {
				return store.states[value as StoreStateKey];
			});
		} else if (typeof value === 'function') {
			(states as Record<string, unknown>)[key] = computed(() => {
				return value(store.states);
			});
		} else {
			console.error('invalid value type');
		}
	});

	return reactive(states) as UseStatesResult<M>;
};
