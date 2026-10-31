<template>
	<div class="v-tabs-alive">
		<div class="v-tabs-alive__controls">
			<Select v-model="alive" :data="BOOLEANS" label="Tabs alive" />
			<Select v-model="lazy" :data="BOOLEANS" label="Tabs lazy" />
			<Select v-model="paneAlive" :data="OVERRIDES" label="面板 B alive" />
			<Select v-model="paneLazy" :data="OVERRIDES" label="面板 C lazy" />
		</div>
		<!-- 配置变化时重新挂载，从头观察渲染与卸载 -->
		<Tabs :key="key" v-model="current" :alive="alive === 'true'" :lazy="lazy === 'true'">
			<TabsPane v-for="item in PANES" :key="item.value" v-bind="paneProps(item.value)" :value="item.value" :label="item.label">
				<PaneProbe :name="item.label" :generation="key" />
			</TabsPane>
		</Tabs>
		<p>在输入框中输入后切换标签：保留的面板会保留输入内容，卸载的面板重新激活时会清空。</p>
		<ol class="v-tabs-alive__log">
			<li v-for="(line, index) in logs" :key="index">{{ line }}</li>
		</ol>
	</div>
</template>

<script setup>
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Tabs, TabsPane } from '..';
import { Select } from '../../select';
import { Input } from '../../input';

// Select 的值为字符串，使用时转为布尔值
const BOOLEANS = [
	{ value: 'true', label: 'true' },
	{ value: 'false', label: 'false' }
];
const OVERRIDES = [
	{ value: 'inherit', label: '继承' },
	...BOOLEANS
];
const PANES = [
	{ value: 'a', label: '面板 A' },
	{ value: 'b', label: '面板 B' },
	{ value: 'c', label: '面板 C' }
];

const alive = ref('true');
const lazy = ref('true');
const paneAlive = ref('inherit');
const paneLazy = ref('inherit');
const current = ref('a');
const logs = ref([]);

const key = computed(() => [alive.value, lazy.value, paneAlive.value, paneLazy.value].join());
watch(key, () => {
	logs.value = [];
	current.value = 'a';
});

// 面板 B 单独设置 alive，面板 C 单独设置 lazy；inherit 时不传
const paneProps = (value) => {
	if (value === 'b' && paneAlive.value !== 'inherit') return { alive: paneAlive.value === 'true' };
	if (value === 'c' && paneLazy.value !== 'inherit') return { lazy: paneLazy.value === 'true' };
	return {};
};

// 记录面板内容的挂载与卸载；重新挂载时旧实例的卸载不计入
const PaneProbe = defineComponent({
	props: { name: String, generation: String },
	setup(props) {
		const text = ref('');
		const log = msg => props.generation === key.value && logs.value.push(`${props.name} ${msg}`);
		onMounted(() => log('内容挂载'));
		onBeforeUnmount(() => log('内容卸载'));
		return () => h(Input, {
			'modelValue': text.value,
			'onUpdate:modelValue': (v) => { text.value = v; },
			'placeholder': `${props.name}的输入框`
		});
	}
});
</script>

<style scoped>
.v-tabs-alive {
	padding: 20px;
}

.v-tabs-alive__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 16px;
}

.v-tabs-alive__controls .vc-select {
	width: 180px;
}

.v-tabs-alive__log {
	padding-left: 20px;
	font-size: 12px;
	line-height: 20px;
}
</style>
