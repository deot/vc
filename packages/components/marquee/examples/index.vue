<template>
	<div style="padding: 20px">
		<Marquee :content="text" style="background: #f7f7f7" />
		<Marquee :content="text" autoplay style="background: #f7f7f7" />
		<br>
		<Marquee style="background: #f7f7f7">
			length: 5 - {{ text.repeat(5) }}
		</Marquee>
		<br>
		<br>
		<Marquee style="background: #f7f7f7">
			length: - 10 {{ text.repeat(10) }}
		</Marquee>
		<br>
		<!-- <vc-carousel
			:height="18"
			:draggable="false"
			:t="1"
			vertical
			style="background: #f7f7f7"
		>
			<vc-carousel-item v-for="item in 3" :key="item">
				<h3>{{ item }}</h3>
			</vc-carousel-item>
		</vc-carousel>
 -->
		<Button @click="handleClick">
			弹窗动画干扰
		</Button>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';
import { Marquee } from '..';

import { Button } from '../../button';
import { Modal } from '../../modal';

const text = ref('ABCDEFG');

const handleClick = () => {
	Modal.success({
		title: 'test',
		content: () => {
			return (
				<Marquee
					content={text.value.repeat(10)}
				/>
			);
		}
	});
};
</script>
