<template>
	<div class="vcm-color-picker-plaintext-demo">
		<h3>编辑</h3>
		<MList>
			<MColorPicker v-model="hex" label="颜色" />
			<MColorPicker v-model="empty" label="空值" />
		</MList>

		<h3>详情（plaintext）</h3>
		<MList>
			<MListItem :arrow="false" label="颜色">
				<template #extra>
					<MColorPicker v-model="hex" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="formatter">
				<template #extra>
					<MColorPicker v-model="hex" :formatter="v => v.toLowerCase()" plaintext />
				</template>
			</MListItem>
			<MListItem :arrow="false" label="空值 + extra">
				<template #extra>
					<MColorPicker v-model="empty" plaintext extra="-" />
				</template>
			</MListItem>
		</MList>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MList, MListItem } from '../../list/index.m';
import { MColorPicker } from '../index.m';

const hex = ref('#5495F6');
const empty = ref('');
</script>

<style lang="scss">
.vcm-color-picker-plaintext-demo {
	h3 {
		padding: 16px 16px 8px;
		font-size: 14px;
		color: #999;
	}
}
</style>
