<template>
	<div class="vc-input-plaintext-demo">
		<Button @click="plaintext = !plaintext">
			plaintext: {{ plaintext }}
		</Button>

		<div class="vc-input-plaintext-demo__row">
			<span class="vc-input-plaintext-demo__label">Input</span>
			<Input v-model="text" :plaintext="plaintext" style="width: 240px" />
		</div>
		<div class="vc-input-plaintext-demo__row">
			<span class="vc-input-plaintext-demo__label">图标属性 + 插槽</span>
			<Input v-model="text" prepend="search" :plaintext="plaintext" style="width: 240px">
				<template #append>
					后缀
				</template>
			</Input>
		</div>
		<div class="vc-input-plaintext-demo__row">
			<span class="vc-input-plaintext-demo__label">InputNumber</span>
			<InputNumber v-model="amount" :precision="2" :plaintext="plaintext" style="width: 240px">
				<template #append>
					元
				</template>
			</InputNumber>
		</div>
		<div class="vc-input-plaintext-demo__row">
			<span class="vc-input-plaintext-demo__label">Textarea</span>
			<Textarea v-model="multiline" :plaintext="plaintext" style="width: 240px" />
		</div>
		<div class="vc-input-plaintext-demo__row">
			<span class="vc-input-plaintext-demo__label">空值 + extra</span>
			<Input v-model="empty" :plaintext="plaintext" extra="-" style="width: 240px" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Input, InputNumber } from '..';
import { Textarea } from '../../textarea';
import { Button } from '../../button';

const plaintext = ref(true);
const text = ref('一段文字');
const amount = ref(100);
const multiline = ref('第一行\n第二行\n第三行');
const empty = ref('');
</script>

<style lang="scss">
.vc-input-plaintext-demo {
	margin: 40px;

	&__row {
		display: flex;
		margin: 16px 0;
		align-items: center;
		gap: 16px;
	}

	&__label {
		width: 120px;
		color: #999;
	}
}
</style>
