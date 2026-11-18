<template>
	<div class="v-marquee-example">
		<Marquee :content="text" class="_box" />
		<Marquee :content="text" always class="_box" />
		<Marquee :content="text.repeat(5)" class="_box" @loop="count++" />
		<Marquee :content="text.repeat(5)" direction="right" :gap="80" class="_box" />
		<Marquee direction="up" :delay="1000" class="_box _vertical">
			<div v-for="item in 3" :key="item">
				第 {{ item }} 条通知
			</div>
		</Marquee>
		<Marquee :content="text.repeat(5)" :animated="animated" :style="{ width: `${width}px` }" class="_box" />
		<p>loop: {{ count }}</p>
		<Button @click="animated = !animated">
			animated: {{ animated }}
		</Button>
		<Button @click="width = width === 240 ? 600 : 240">
			width: {{ width }}
		</Button>
		<Button @click="handleClick">
			弹窗内
		</Button>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Marquee } from '..';
import { Button } from '../../button';
import { Modal } from '../../modal';

const text = ref('ABCDEFG ');
const count = ref(0);
const animated = ref(true);
const width = ref(240);

const handleClick = () => {
	Modal.success({
		title: 'test',
		content: () => (<Marquee content={text.value.repeat(10)} />)
	});
};
</script>
<style>
.v-marquee-example { padding: 20px; }
.v-marquee-example ._box {
	width: 240px;
	padding: 8px 12px;
	margin-bottom: 8px;
	background: #f7f7f7;
}
.v-marquee-example ._vertical {
	height: 40px;
	line-height: 20px;
}
</style>
