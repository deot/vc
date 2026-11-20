<template>
	<div class="m-tab-bar-demo">
		<div class="m-tab-bar-demo__title">
			基础用法（data）：当前 {{ value }}
		</div>
		<MTabBar v-model="value" :data="tabs" />

		<div class="m-tab-bar-demo__title">
			子组件写法：value 缺省时取序号，当前 {{ index }}
		</div>
		<MTabBar v-model="index">
			<MTabBarItem label="首页" icon="grid" />
			<MTabBarItem label="分类" icon="list" />
			<MTabBarItem label="购物车" icon="cart" :badge="3" />
			<MTabBarItem label="我的" icon="account" />
		</MTabBar>

		<div class="m-tab-bar-demo__title">
			徽标：数字、文字、圆点与透传给 MBadge 的对象
		</div>
		<MTabBar :data="badges" />

		<div class="m-tab-bar-demo__title">
			仅图标
		</div>
		<MTabBar :data="tabs.map(({ label, ...item }) => item)" />

		<div class="m-tab-bar-demo__title">
			仅文字：徽标挂在文字右上角
		</div>
		<MTabBar :data="tabs.map(({ icon, ...item }, i) => (i === 1 ? { ...item, badge: 6 } : item))" />

		<div class="m-tab-bar-demo__title">
			选中换图标：icon / activeIcon 返回图片
		</div>
		<MTabBar :data="imageTabs" />

		<div class="m-tab-bar-demo__title">
			自定义：#item 插槽画中间凸起按钮，禁用项
		</div>
		<MTabBar v-model="custom" :data="customTabs">
			<template #item="{ item, active }">
				<div v-if="item.value === 'publish'" class="m-tab-bar-demo__publish">
					<MIcon type="plus" />
				</div>
				<template v-else>
					<MIcon class="m-tab-bar-demo__icon" :type="item.icon" />
					<div class="m-tab-bar-demo__label" :class="{ 'is-active': active }">
						{{ item.label }}
					</div>
				</template>
			</template>
		</MTabBar>

		<div class="m-tab-bar-demo__title">
			颜色：--vc-tab-bar-color / --vc-tab-bar-active-color / --vc-tab-bar-background
		</div>
		<MTabBar :data="tabs" class="m-tab-bar-demo__colored" />

		<div class="m-tab-bar-demo__title">
			跳转（to）：重复点击当前项不跳转，click 每次都触发
		</div>
		<div class="m-tab-bar-demo__log">
			{{ log }}
		</div>

		<!-- 固定在底部：根节点留同高占位（含安全区），页面内容不会被遮住 -->
		<MTabBar
			v-model="path"
			fixed
			:data="routes"
			@click="(v) => (log = `click ${v}，当前 ${path}`)"
		/>
	</div>
</template>

<script setup>
import { h, ref } from 'vue';
import { MIcon } from '../../icon/index.m';
import { MTabBar, MTabBarItem } from '../index.m';

const value = ref('message');
const index = ref(0);
const custom = ref('home');

const tabs = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'message', label: '消息', icon: 'notice' },
	{ value: 'service', label: '服务', icon: 'service' },
	{ value: 'mine', label: '我的', icon: 'account' }
];

const badges = [
	{ value: 'home', label: '首页', icon: 'grid', badge: true },
	{ value: 'message', label: '消息', icon: 'notice', badge: 128 },
	{ value: 'service', label: '服务', icon: 'service', badge: '新' },
	{ value: 'mine', label: '我的', icon: 'account', badge: { dot: true, color: '#1DB88C' } }
];

const customTabs = [
	{ value: 'home', label: '首页', icon: 'grid' },
	{ value: 'search', label: '发现', icon: 'search' },
	{ value: 'publish' },
	{ value: 'cart', label: '购物车', icon: 'cart', disabled: true },
	{ value: 'mine', label: '我的', icon: 'account' }
];

const svg = color => `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" rx="8" fill="${color}"/></svg>`
)}`;
const images = {
	normal: svg('#C4C9D2'),
	active: svg('#456CF6')
};

const imageTabs = tabs.map(item => ({
	...item,
	icon: () => h('img', { src: images.normal, alt: '' }),
	activeIcon: () => h('img', { src: images.active, alt: '' })
}));

const path = ref('/home');
const log = ref('点击底部标签');
const go = (target) => {
	log.value = `跳转到 ${target}`;
};
const routes = [
	{ value: '/home', label: '首页', icon: 'grid', to: () => go('/home') },
	{ value: '/message', label: '消息', icon: 'notice', badge: 5, to: () => go('/message') },
	{ value: '/mine', label: '我的', icon: 'account', to: () => go('/mine') }
];
</script>

<style lang="scss">
.m-tab-bar-demo {
	min-height: 100vh;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 16);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__log {
		padding: 0 calc(var(--vc-rem) * 32) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-light);
	}

	&__icon {
		margin: calc(var(--vc-rem) * 14) 0 calc(var(--vc-rem) * 8);
		font-size: calc(var(--vc-rem) * 40);
	}

	&__label {
		margin-bottom: calc(var(--vc-rem) * 10);
		font-size: calc(var(--vc-rem) * 20);
		line-height: calc(var(--vc-rem) * 28);
	}

	&__publish {
		display: flex;
		width: calc(var(--vc-rem) * 96);
		height: calc(var(--vc-rem) * 96);
		margin-top: calc(var(--vc-rem) * -32);
		font-size: calc(var(--vc-rem) * 44);
		color: #fff;
		background: var(--vc-color-primary);
		border-radius: 50%;
		box-shadow: 0 calc(var(--vc-rem) * 8) calc(var(--vc-rem) * 24) rgb(69 108 246 / 40%);
		align-items: center;
		justify-content: center;
	}

	&__colored {
		--vc-tab-bar-color: rgb(255 255 255 / 60%);
		--vc-tab-bar-active-color: #fff;
		--vc-tab-bar-background: #1D2129;
	}
}
</style>
