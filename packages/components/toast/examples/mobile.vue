<template>
	<div style="height: 2000px">
		<div @click="handleClick('normal', 15000)">
			点击
		</div>
		<div @click="handleClick('loading', 1000)">
			点击加载中
		</div>
		<div @click="handleClick('loading', 0)">
			点击加载中, 不销毁
		</div>
	</div>
</template>
<script setup>
import { onMounted } from 'vue';
import { MToast } from '../index.m';

window.MToast = MToast;

const sleep = delay => new Promise(_ => setTimeout(_, delay * 1000 || 0));

onMounted(async () => {
	MToast.info('测试1', 1000);
	await sleep(1);

	MToast.info(`测试2: 换行 <br> tt <br> zz`, 1000);
	await sleep(1);

	MToast.info('测试3: 销毁', 10000);
	await sleep(1);

	MToast.destroy();
});

const handleClick = (v, timestamp) => {
	if (v == 'normal') {
		MToast.info('测试', timestamp, () => {
			console.log('回调');
		});
	} else {
		MToast.loading('加载中', timestamp, () => {
			console.log('回调');
		});
	}
};
</script>
