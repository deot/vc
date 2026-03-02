<template>
	<div>
		<h1 @click="isActive = !isActive">isActive: {{ isActive }}</h1>
		<div style="display: flex; flex-wrap: wrap;">
			<Defer v-if="isActive" :data="dataSource" :disabled="disabled" @complete="handleComplete">
				<template #default="{ row }">
					<div class="box" :style="{ background: row.background }">
						{{ row.count }}
					</div>
				</template>
			</Defer>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Defer } from '..';

const disabled = ref(false);
const isActive = ref(true);
const random255 = () => Math.floor(Math.random() * 255);
const randomColor = () => `rgba(${random255()}, ${random255()}, ${random255()}, ${Math.random()})`;

const genTableData = length => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	background: randomColor(),
	count: length === index + 1 ? length : (index + 1) % 100
}));

const dataSource = ref(genTableData(200000));

const handleComplete = (v) => {
	console.log('complete', `${v}ms`);
};

</script>

<style>
h1 {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	color: white;
	background: black;
}

.box {
	width: 30px;
	height: 30px;
}
</style>
