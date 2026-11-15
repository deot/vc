<template>
	<div class="rate-demo">
		<div class="rate-demo__row">
			<Rate
				v-model="value"
				half
				clearable
				:tooltip="tooltip"
			/>
			<span>value: {{ value }}（{{ typeof value }}）</span>
		</div>
		<p class="rate-demo__text">
			行内的评分 <Rate :model-value="4" readonly /> 与文字基线对齐
		</p>
		<div class="rate-demo__row">
			<Rate :model-value="3.5" half readonly />
			<span>readonly</span>
		</div>
		<div class="rate-demo__row">
			<Rate :model-value="3.5" half disabled />
			<span>disabled</span>
		</div>
		<div class="rate-demo__row">
			<Rate v-model="value" character="好" color="#F53F3F" half />
			<Rate v-model="face" :count="3">
				<template #character="{ index }">
					<span>{{ faces[index] }}</span>
				</template>
			</Rate>
			<Rate v-model="value" :icon-style="{ fontSize: '24px' }" half />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Rate } from '..';

const value = ref(3.5);
const face = ref(2);
const tooltip = ['极差', '差', '一般', '好', '极好'];
const faces = ['差', '中', '好'];
</script>

<style lang="scss">
.rate-demo {
	padding: 20px;

	&__row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
	}

	&__text {
		margin: 0 0 16px;
		font-size: 14px;
	}
}
</style>
