<template>
	<div>
		<h1 @click="handleShuffle">
			乱序测试: <Icon :type="items[0]"/>
		</h1>
		<h2 @click="handleClick">
			点我切换 prefix: {{ mobile ? 'vcm-' : 'vc-' }}
		</h2>
		<div class="vc-icon-basic">
			<!-- index 仅用于乱序测试 -->
			<div 
				v-for="(item, index) in items" 
				:key="index" 
				:value="`<vc${m}-icon type=&quot;${item}&quot; />`"
			>
				<Icon
					:type="item" 
					inherit 
					@click="(e) => handleIconClick(item, e)" 
				/>
				<p>{{ item }}</p>
			</div>
		</div>
	</div>
</template>
<script setup>
import {  onMounted, ref, computed } from 'vue';
import { shuffle } from 'lodash-es';
import { Icon, IconManager } from '..';

const items = ref([]);
const mobile = ref(false);
const m = computed(() => (mobile.value ? 'm' : ''));

onMounted(async () => {
	await new Promise(_ => setTimeout(_, 0));
	await Promise.all([
		IconManager.basicStatus,
		IconManager.load('//at.alicdn.com/t/font_1169912_ith92i2hims.js'),
		IconManager.load('//at.alicdn.com/t/font_1096960_8zo6tsnmj3p.js'),
		IconManager.load('//at.alicdn.com/t/font_1096957_cypkws8poed.js')
	]);

	items.value = Object.keys(IconManager.icons);
});

const handleClick = () => {
	mobile.value = !mobile.value;
};

const handleShuffle = () => {
	items.value = shuffle(items.value);
};

const handleIconClick = (item, e) => {
	console.log(item, e);
};
</script>
<style lang="scss">
.vc-icon-basic {
	display: flex;
	flex-wrap: wrap;
	div {
		width: 200px;
		padding: 20px;
		text-align: center;
		cursor: pointer;
	}
	i {
		font-size: 30px
	}
	svg {
		width: 1em;
		height: 1em;
		fill: currentColor;
		overflow: hidden;
	}
}
</style>
