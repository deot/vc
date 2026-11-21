<template>
	<div class="m-nav-bar-demo">
		<!-- 页面自己的导航栏：固定在顶部，根节点留同高占位（含安全区），内容不会被遮住 -->
		<MNavBar fixed title="导航栏" @back="log = '点击了返回（固定在顶部）'" />

		<div class="m-nav-bar-demo__log">
			{{ log }}
		</div>

		<div class="m-nav-bar-demo__title">
			基础用法：默认显示返回箭头，没有监听 back 时回到上一页
		</div>
		<MNavBar title="标题" @back="log = '点击了返回'" />

		<div class="m-nav-bar-demo__title">
			返回加文字、右侧文字
		</div>
		<MNavBar title="标题" back="返回" right="编辑" @back="log = '点击了返回'" />

		<div class="m-nav-bar-demo__title">
			只有文字：backIcon 为 false；右侧放按钮
		</div>
		<MNavBar title="新建" back="取消" :back-icon="false" @back="log = '点击了取消'">
			<template #right>
				<MButton size="small" type="primary">
					完成
				</MButton>
			</template>
		</MNavBar>

		<div class="m-nav-bar-demo__title">
			不显示返回；右侧图标
		</div>
		<MNavBar title="消息" :back="false">
			<template #right>
				<div class="m-nav-bar-demo__icons">
					<MIcon type="search" />
					<MIcon type="setting" />
				</div>
			</template>
		</MNavBar>

		<div class="m-nav-bar-demo__title">
			副标题；#left 放在返回区域之后
		</div>
		<MNavBar title="标题" subtitle="副标题" @back="log = '点击了返回'">
			<template #left>
				<MIcon type="close" class="m-nav-bar-demo__close" @click="log = '点击了关闭'" />
			</template>
		</MNavBar>

		<div class="m-nav-bar-demo__title">
			超长标题：两侧宽度不同时标题仍在正中，过长时省略
		</div>
		<MNavBar title="这是一条很长很长很长很长很长很长很长的标题" back="返回" @back="log = '点击了返回'">
			<template #right>
				<MIcon type="share" />
			</template>
		</MNavBar>
		<MNavBar title="短标题" back="返回上一页" right="更多" @back="log = '点击了返回'" />

		<div class="m-nav-bar-demo__title">
			中间放 MTabs：#default 替换整个中间区域
		</div>
		<MNavBar @back="log = '点击了返回'">
			<MTabs v-model="tab" class="m-nav-bar-demo__tabs">
				<MTabsPane label="关注" value="follow" />
				<MTabsPane label="推荐" value="recommend" />
				<MTabsPane label="附近" value="nearby" />
			</MTabs>
			<template #right>
				<MIcon type="search" />
			</template>
		</MNavBar>

		<div class="m-nav-bar-demo__title">
			颜色：--vc-nav-bar-color / --vc-nav-bar-background；border 为 false 时没有分割线
		</div>
		<MNavBar title="标题" :border="false" class="m-nav-bar-demo__colored" @back="log = '点击了返回'">
			<template #right>
				<MIcon type="share" />
			</template>
		</MNavBar>

		<div class="m-nav-bar-demo__title">
			沉浸式：transparent 为数字（750 稿）时，向下滚动 300 由透明渐变为实底，插槽的 progress 用来切换图标颜色
		</div>
		<div class="m-nav-bar-demo__immersive">
			<MNavBar
				:transparent="300"
				:get-scroller="() => scroller"
				title="详情"
				class="m-nav-bar-demo__overlay"
				@back="log = '点击了返回（沉浸式）'"
			>
				<template #back="{ progress }">
					<MIcon type="left" class="m-nav-bar-demo__back" :class="{ 'is-light': progress < 0.5 }" />
				</template>
				<template #right="{ progress }">
					<MIcon type="share" :class="{ 'is-light': progress < 0.5 }" />
				</template>
			</MNavBar>
			<div ref="scroller" class="m-nav-bar-demo__scroller">
				<div class="m-nav-bar-demo__hero">
					头图
				</div>
				<div v-for="i in 12" :key="i" class="m-nav-bar-demo__row">
					内容 {{ i }}
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MIcon } from '../../icon/index.m';
import { MButton } from '../../button/index.m';
import { MTabs, MTabsPane } from '../../tabs/index.m';
import { MNavBar } from '../index.m';

const log = ref('点击导航栏左侧的返回区域');
const tab = ref('recommend');
const scroller = ref();
</script>

<style lang="scss">
.m-nav-bar-demo {
	min-height: 100vh;
	padding-bottom: calc(var(--vc-rem) * 64);
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 16);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__log {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32) 0;
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-light);
	}

	.vcm-nav-bar + .vcm-nav-bar {
		margin-top: calc(var(--vc-rem) * 16);
	}

	&__icons {
		display: flex;
		gap: calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 40);
	}

	&__close {
		font-size: calc(var(--vc-rem) * 36);
	}

	&__tabs {
		width: 100%;
	}

	&__colored {
		--vc-nav-bar-color: #fff;
		--vc-nav-bar-background: var(--vc-color-primary);
	}

	&__immersive {
		position: relative;
		height: calc(var(--vc-rem) * 720);
		overflow: hidden;
	}

	&__overlay {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 1;
	}

	&__back {
		font-size: calc(var(--vc-rem) * 40);
	}

	.is-light {
		color: #fff;
		transition: color 0.2s;
	}

	&__scroller {
		height: 100%;
		overflow: auto;
		background: var(--vc-background-color-lightest);
	}

	&__hero {
		display: flex;
		height: calc(var(--vc-rem) * 400);
		font-size: calc(var(--vc-rem) * 32);
		color: #fff;
		background: linear-gradient(135deg, #456CF6, #1DB88C);
		align-items: center;
		justify-content: center;
	}

	&__row {
		padding: calc(var(--vc-rem) * 28) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark);
		border-bottom: 1px solid var(--vc-color-neutral-light);
	}
}
</style>
