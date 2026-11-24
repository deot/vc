<template>
	<div class="v-back-top-basic">
		<div class="_bar">
			<span>状态：{{ visible ? '已显示' : '未显示' }}</span>
			<span>点击次数：{{ count }}</span>
			<Button @click="duration = duration ? 0 : 300">
				duration: {{ duration }}
			</Button>
			<Button @click="showProgress = !showProgress">
				showProgress: {{ showProgress }}
			</Button>
			<Button @click="custom = !custom">
				自定义内容: {{ custom }}
			</Button>
		</div>
		<p>向下滚动页面超过 200px 后，右下角出现按钮；点击平滑回到顶部，滚动中再滚动滚轮会停止</p>
		<div v-for="item in 40" :key="item" class="_row">
			第 {{ item }} 行
		</div>
		<BackTop
			v-model="visible"
			:duration="duration"
			:show-progress="showProgress"
			:class="{ '_custom': custom }"
			@click="count++"
		>
			<template v-if="custom" #default>
				顶部
			</template>
		</BackTop>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { BackTop } from '..';

const visible = ref(false);
const count = ref(0);
const duration = ref(300);
const showProgress = ref(true);
const custom = ref(false);
</script>
<style>
.v-back-top-basic ._bar {
	position: sticky;
	top: 0;
	z-index: 1;
	display: flex;
	padding: 8px 0;
	background: var(--vc-color-light);
	align-items: center;
	gap: 12px;
}

.v-back-top-basic ._row {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}

.vc-back-top._custom {
	width: auto;
	padding: 0 16px;
	font-size: 13px;
	border-radius: 20px;

	--vc-back-top-background: var(--vc-color-primary);
	--vc-back-top-color: #fff;
	--vc-back-top-hover-color: #fff;
	--vc-back-top-border-color: transparent;
	--vc-back-top-progress-color: #fff;
}
</style>
