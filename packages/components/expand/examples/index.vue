<template>
	<div>
		<span @click="alive = !alive">alive: {{ alive ? 'true' : 'false' }}</span>
		<span @click="handleToggle">
			更多搜索条件{{ isVisible ? `up` : `down` }}
		</span>
		<Icon :type="`triangle-${isVisible ? `up2` : `down2`}`" />
		<Expand 
			ref="expand"
			v-model="isVisible"
			:alive="alive"
		>
			<div>
				<div>1</div>
				<div>2</div>
				<div>3</div>
				<div>4</div>
				<div>5</div>
				<div>6</div>
				<div>7</div>
				<div>8</div>
			</div>
		</Expand>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Expand } from '..';
import { Icon } from '../../icon';

const isVisible = ref(false);
const alive = ref(false);
const handleToggle = () => {
	isVisible.value = !isVisible.value;
};
</script>
