<template>
	<div>
		<button @click="value = `<h1>打印的内容</h1>`">
			html
		</button>
		<Print ref="pageTarget" :value="value">
			打印的内容
			打印的内容
			打印的内容
			打印的内容
			打印的内容
		</Print>
		<div @click="handleClick">
			点我打印
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Print } from '..';

const value = ref('');
const pageTarget = ref(null);

const handleClick = () => {
	pageTarget.value.print();
};

</script>
