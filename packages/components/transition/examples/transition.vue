<template>
	<div style="padding: 100px">
		<h3 @click="handleClick">
			点击触发: {{ isVisible }}
		</h3>
		<VTransition @before-enter="handleBeforeEnter">
			<div v-show="isVisible">
				Transition
			</div>
		</VTransition>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Transition as VTransition } from '..';

const isVisible = ref(true);

const handleBeforeEnter = (el) => {
	console.log('before-enter', el);
};
const handleClick = () => {
	isVisible.value = !isVisible.value;
};

</script>
