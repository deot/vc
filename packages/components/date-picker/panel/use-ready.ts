import { ref, onMounted, nextTick } from 'vue';

export const useReady = () => {
	const isReady = ref(false);

	onMounted(() => {
		nextTick(() => {
			isReady.value = true;
		});
	});

	return isReady;
};
