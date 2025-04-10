<template>
	<div style="padding: 100px">
		<h3 @click="handleClick">
			点击触发: {{ isVisible }}
		</h3>
		<VTransition @before-enter="handleBeforeEnter" @after-leave="handleAfterLeave">
			<div v-show="isVisible">
				Transition
			</div>
		</VTransition>
		<TransitionScale mode="part" @before-enter="handleBeforeEnter" @after-leave="handleAfterLeave">
			<div v-show="isVisible">
				Transition
			</div>
		</TransitionScale>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Transition as VTransition, TransitionScale } from '..';

const isVisible = ref(true);

const handleBeforeEnter = (el) => {
	console.log('before-enter', el);
};

const handleAfterLeave = (el) => {
	console.log('after-leave', el);
};
const handleClick = () => {
	isVisible.value = !isVisible.value;
};

</script>
