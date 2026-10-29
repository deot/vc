<template>
	<div class="grid-example">
		<p>collapsed 时只显示前 collapsedRows 行；suffix 项预留在最后一行末尾，插槽参数 overflow 表示是否有项被隐藏</p>
		<div class="grid-example__controls">
			<Select v-model="rows" :data="ROWS" label="collapsedRows" />
		</div>

		<Grid
			:collapsed="collapsed"
			:collapsed-rows="rows"
			:columns="{ xs: 1, sm: 2, md: 3, lg: 4 }"
			:gap="[16, 12]"
		>
			<GridItem v-for="i in 9" :key="i" :span="1">
				<Input :placeholder="`条目 ${i}`" />
			</GridItem>
			<GridItem :span="1" suffix justify="end">
				<template #default="{ overflow }">
					<Button @click="collapsed = !collapsed">
						{{ collapsed ? `展开${overflow ? '' : '（已全部显示）'}` : '收起' }}
					</Button>
				</template>
			</GridItem>
		</Grid>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '../../select';
import { Input } from '../../input';
import { Button } from '../../button';
import { Grid, GridItem } from '..';

const ROWS = [1, 2, 3].map(value => ({ value, label: `${value} 行` }));
const rows = ref(ROWS[0].value);
const collapsed = ref(true);
</script>
<style scoped>
.grid-example {
	padding: 20px;
}

.grid-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.grid-example__controls .vc-select {
	width: 240px;
}
</style>
