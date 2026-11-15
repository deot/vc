<template>
	<div class="m-rate-demo">
		<div class="m-rate-demo__title">
			基础用法（375 宽下星星 24、间距 12；点按或按住左右滑动）
		</div>
		<div class="m-rate-demo__card">
			<MRate v-model="value" />
			<div class="m-rate-demo__value">
				当前：{{ value }}
			</div>
		</div>

		<div class="m-rate-demo__title">
			半星、可清零（再次点按当前分值清零）
		</div>
		<div class="m-rate-demo__card">
			<MRate v-model="half" half clearable />
			<div class="m-rate-demo__value">
				当前：{{ half }}
			</div>
		</div>

		<div class="m-rate-demo__title">
			提示文字（滑动时跟随预览）
		</div>
		<div class="m-rate-demo__card">
			<MRate v-model="tip" :tooltip="tooltip" />
		</div>

		<div class="m-rate-demo__title">
			只读、禁用
		</div>
		<div class="m-rate-demo__card m-rate-demo__list">
			<MRate :model-value="3.5" half readonly />
			<MRate :model-value="3.5" half disabled />
		</div>

		<div class="m-rate-demo__title">
			自定义字符、颜色与尺寸
		</div>
		<div class="m-rate-demo__card m-rate-demo__list">
			<MRate v-model="custom" character="好" color="#F53F3F" half />
			<MRate v-model="custom" class="m-rate-demo__large" half />
			<MRate v-model="face" :count="3">
				<template #character="{ index }">
					<span>{{ faces[index] }}</span>
				</template>
			</MRate>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MRate } from '../index.m';

const value = ref(3);
const half = ref(2.5);
const tip = ref(4);
const custom = ref(1.5);
const face = ref(2);
const tooltip = ['极差', '差', '一般', '好', '极好'];
const faces = ['差', '中', '好'];
</script>

<style lang="scss">
.m-rate-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__card {
		padding: calc(var(--vc-rem) * 32);
		background: var(--vc-background-color-lightest);
	}

	&__list {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: calc(var(--vc-rem) * 16);
	}

	&__value {
		margin-top: calc(var(--vc-rem) * 16);
		font-size: calc(var(--vc-rem) * 24);
		color: var(--vc-color-dark-extralight);
	}

	&__large {
		--vc-rate-size: calc(var(--vc-rem) * 64);
		--vc-rate-gap: calc(var(--vc-rem) * 16);
	}
}
</style>
