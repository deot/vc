<template>
	<div class="scrollable-demo">
		<p class="scrollable-demo__tip">
			内容区默认由内置的 Scroller 滚动，scrollerOptions 透传其属性；scrollable 为 false 时不渲染内置 Scroller，
			内容的根节点设置 min-height: 0 后由其内部的滚动容器滚动。
		</p>
		<div class="scrollable-demo__options">
			<span>行数</span>
			<Select v-model="rows" :data="rowOptions" style="width: 120px;" />
		</div>
		<Button @click="isOptionsVisible = true">
			scrollerOptions（滚动条常显）
		</Button>
		<Button @click="isCustomVisible = true">
			scrollable=false（两列各自滚动）
		</Button>

		<Drawer
			v-model="isOptionsVisible"
			title="scrollerOptions"
			:width="480"
			:scroller-options="{ always: true }"
		>
			<div v-for="i in rows" :key="i">
				第 {{ i }} 行内容
			</div>
		</Drawer>

		<Drawer
			v-model="isCustomVisible"
			title="scrollable=false"
			:width="480"
			:scrollable="false"
			:content-style="{ padding: 0 }"
		>
			<div class="scrollable-demo__columns">
				<Scroller v-for="column in 2" :key="column" class="scrollable-demo__column">
					<div v-for="i in rows" :key="i">
						第 {{ column }} 列 {{ i }}
					</div>
				</Scroller>
			</div>
		</Drawer>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Drawer } from '..';
import { Button } from '../../button';
import { Select } from '../../select';
import { Scroller } from '../../scroller';

const rows = ref(60);
const rowOptions = [5, 20, 60, 200].map(value => ({ value, label: `${value} 行` }));
const isOptionsVisible = ref(false);
const isCustomVisible = ref(false);
</script>

<style lang="scss">
.scrollable-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__options {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 24px;
	}

	// scrollable=false：根节点设 min-height: 0 在内容区的高度内收缩，由各列滚动
	&__columns {
		display: flex;
		min-height: 0;
		flex: 1;
	}

	&__column {
		padding: 12px 24px;
		flex: 1;
	}
}
</style>
