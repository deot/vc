<template>
	<div class="m-collapse-demo">
		<div class="m-collapse-demo__title">
			基础用法（375 宽下标题栏高 54）
		</div>
		<MCollapse v-model="value">
			<MCollapseItem :value="1" title="标题一" :content="text" />
			<MCollapseItem :value="2" title="标题二" extra="附加内容" :content="text" />
			<MCollapseItem :value="3" title="禁用" disabled :content="text" />
		</MCollapse>

		<div class="m-collapse-demo__title">
			手风琴、箭头在右
		</div>
		<MCollapse v-model="accordion" accordion arrow="right">
			<MCollapseItem v-for="item in 3" :key="item" :value="item" :title="`标题${item}`" :content="text" />
		</MCollapse>

		<div class="m-collapse-demo__title">
			附加内容插槽、自定义箭头
		</div>
		<MCollapse v-model="custom" arrow="right">
			<MCollapseItem :value="1" title="附加按钮">
				<template #extra="{ visible }">
					<MButton size="mini" @click="count++">
						{{ visible ? '展开中' : '收起中' }} · {{ count }}
					</MButton>
				</template>
				<template #content>
					点击按钮不会切换面板
				</template>
			</MCollapseItem>
			<MCollapseItem :value="2" title="自定义箭头" :content="text">
				<template #arrow="{ visible }">
					<span class="m-collapse-demo__arrow">{{ visible ? '收起' : '展开' }}</span>
				</template>
			</MCollapseItem>
		</MCollapse>

		<div class="m-collapse-demo__title">
			无边框
		</div>
		<MCollapse v-model="plain" :border="false">
			<MCollapseItem :value="1" title="标题一" :content="text" />
			<MCollapseItem :value="2" title="标题二" :content="text" />
		</MCollapse>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MCollapse, MCollapseItem } from '../index.m';
import { MButton } from '../../button/index.m';

const text = '这里是内容区域，字号与行高随屏幕宽度等比缩放，内容较长时自动换行显示。';
const value = ref([1]);
const accordion = ref(1);
const custom = ref([]);
const plain = ref([]);
const count = ref(0);
</script>

<style lang="scss">
.m-collapse-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__arrow {
		font-size: calc(var(--vc-rem) * 28);
		font-weight: 400;
		color: var(--vc-color-primary);
	}
}
</style>
