<template>
	<div class="spin-demo">
		<h3>尺寸与文字混排</h3>
		<div class="spin-demo__row">
			<Spin :size="16" />
			<Spin />
			<Spin :size="44" />
			<span>文字 <Spin :size="14" /> 混排</span>
		</div>

		<h3>文字提示（tip 属性 / 插槽）</h3>
		<div class="spin-demo__row">
			<Spin tip="加载中，请稍候" />
			<Spin>
				<template #tip>
					已加载 <b>{{ percent }}%</b>
				</template>
			</Spin>
		</div>

		<h3>包裹内容</h3>
		<div class="spin-demo__row">
			<Switch v-model="loading" />
			<span>加载中</span>
			<Switch v-model="mask" />
			<span>蒙层</span>
		</div>
		<Spin :loading="loading" :mask="mask" tip="加载中" class="spin-demo__area">
			<div class="spin-demo__card">
				<h4>区域标题</h4>
				<p>这里是被包裹的内容，加载时上面会显示加载图标；关闭蒙层后内容仍可操作。</p>
				<Button size="small" @click="count++">
					点击次数：{{ count }}
				</Button>
			</div>
		</Spin>

		<h3>延迟显示（delay 300）</h3>
		<div class="spin-demo__row">
			<Button @click="load(150)">
				快请求（150ms）
			</Button>
			<Button @click="load(1500)">
				慢请求（1500ms）
			</Button>
		</div>
		<Spin :loading="requesting" :delay="300" class="spin-demo__area">
			<div class="spin-demo__card">
				第 {{ times }} 次结果
			</div>
		</Spin>

		<h3>颜色与线宽</h3>
		<div class="spin-demo__row">
			<Spin color="#e6a23c" track-color="#64758b" />
			<div style="--vc-spin-color: #1db88c; --vc-spin-stroke-width: 4;">
				<Spin />
			</div>
			<Spin :size="24">
				<template #loading>
					<svg viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="16 8" />
					</svg>
				</template>
			</Spin>
		</div>
	</div>
</template>
<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { Spin } from '..';
import { Button } from '../../button';
import { Switch } from '../../switch';

const percent = ref(0);
const loading = ref(true);
const mask = ref(true);
const count = ref(0);
const requesting = ref(false);
const times = ref(1);

const progress = setInterval(() => (percent.value = (percent.value + 7) % 100), 300);

let timer;
const load = (duration) => {
	clearTimeout(timer);
	requesting.value = true;
	timer = setTimeout(() => {
		times.value++;
		requesting.value = false;
	}, duration);
};

onBeforeUnmount(() => {
	clearInterval(progress);
	clearTimeout(timer);
});
</script>
<style>
.spin-demo { padding: 16px; }
.spin-demo h3 { margin: 24px 0 12px; font-size: 14px; font-weight: 500; color: var(--vc-color-dark-light); }
.spin-demo h3:first-child { margin-top: 0; }
.spin-demo__row { display: flex; align-items: center; gap: 24px; }
.spin-demo__area { max-width: 480px; margin-top: 12px; }
.spin-demo__card { padding: 24px; border: 1px solid var(--vc-border-color); border-radius: 8px; }
.spin-demo__card h4 { margin: 0 0 8px; }
.spin-demo__card p { margin: 0 0 12px; }
</style>
