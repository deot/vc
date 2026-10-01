<!-- 内容条数动态变化；内容用 Customer 渲染时在控制台打印渲染日志，可确认滚动不会让内容重渲染 -->
<template>
	<div class="scroller-dynamic">
		<div class="scroller-dynamic__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div class="scroller-dynamic__actions">
			<span>条数：{{ count }}</span>
			<Button @click="count++">+</Button>
			<Button @click="count = Math.max(0, count - 1)">-</Button>
			<Button @click="count *= 10">×10</Button>
			<Button @click="count = Math.floor(count / 10)">÷10</Button>
		</div>
		<Scroller height="200px" v-bind="options">
			<template v-if="controls.content === 'v-for'">
				<p v-for="item in count" :key="item">
					{{ item }}
				</p>
			</template>
			<template v-else>
				<!-- 不使用 v-for：整个列表由一个渲染函数给出 -->
				<Customer :render="renderList" :length="count" type="custom" />
				<!-- 使用 v-for：每项各自渲染 -->
				<Customer
					v-for="item in count"
					:key="item"
					:render="renderItem"
					:index="item"
					type="vFor"
				/>
			</template>
		</Scroller>
	</div>
</template>
<script setup lang="jsx">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { Scroller } from '..';
import { Button } from '../../button';
import { Customer } from '../../customer';
import { Select } from '../../select';

// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'wheel', label: 'wheel', data: [{ value: 'off', label: '关闭（跟随原生滚动）' }, { value: 'on', label: '开启（滚轮驱动）' }] },
	{ key: 'native', label: 'native', data: [{ value: 'off', label: 'false（自绘滚动条）' }, { value: 'on', label: 'true（原生滚动条）' }] },
	{ key: 'always', label: 'always', data: [{ value: 'on', label: 'true（始终显示）' }, { value: 'off', label: 'false（悬停显示）' }] },
	{ key: 'content', label: '内容', data: [{ value: 'v-for', label: 'v-for' }, { value: 'customer', label: 'Customer（打印渲染日志）' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const options = computed(() => ({
	wheel: controls.wheel === 'on',
	native: controls.native === 'on',
	always: controls.always === 'on'
}));

const count = ref(100);

const renderItem = (props) => {
	const { index, type } = props;
	console.log(`renderItem ${type}`, index);
	return <p>{ `${type} - ${index}` }</p>;
};

const renderList = (props) => {
	const { length, type } = props;
	console.log(`renderList ${type}`, length);
	return Array.from({ length }, (_, i) => i + 1).map(item => (
		<Customer key={item} render={renderItem} index={item} type={type} />
	));
};

// 右上角的性能读数：切换对照项或条数后清零
window.$perf?.observe();
watch([controls, count], () => window.$perf?.reset());
onBeforeUnmount(() => window.$perf?.disconnect());
</script>

<style lang="scss">
.scroller-dynamic {
	padding: 20px;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;

		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;

		.vc-select {
			width: 240px;
		}
	}

	&__actions {
		display: flex;
		gap: 8px;
		margin: 12px 0;
		align-items: center;
	}

	p {
		display: flex;
		width: 100%;
		height: 50px;
		margin: 10px 0;
		color: #409eff;
		text-align: center;
		background: #ecf5ff;
		border-radius: 4px;
		align-items: center;
		justify-content: center;
	}
}
</style>
