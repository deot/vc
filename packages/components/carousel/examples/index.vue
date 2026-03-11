<!-- 仅展示最基本的用法 -->
<template>
	<div style="padding: 20px">
		<div>
			<span>默认 Hover 指示器触发</span>
			<Carousel :height="150">
				<CarouselItem v-if="showFirst">
					<h3>动态: 应该出现在第一个</h3>
				</CarouselItem>
				<CarouselItem v-for="item in 4" :key="`item_${item}`">
					<h3>{{ item }}</h3>
				</CarouselItem>
				<CarouselItem v-if="showLast">
					<h3>动态: 应该出现在最后一个</h3>
				</CarouselItem>
			</Carousel>
		</div>
		<br>
		<br>
		<br>
		<div>
			<Carousel :t="4000" :height="200" type="card">
				<CarouselItem v-for="item in 6" :key="item">
					<h3 class="medium">
						{{ item }}
					</h3>
				</CarouselItem>
			</Carousel>
		</div>
		<br>
		<br>
		<br>
		<div>
			<Carousel :autoplay="false" :height="200" vertical>
				<CarouselItem v-for="item in 3" :key="item">
					<h3 class="medium">
						{{ item }}
					</h3>
				</CarouselItem>
			</Carousel>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Carousel, CarouselItem } from '..';

const showFirst = ref(false);
const showLast = ref(false);
setTimeout(() => showLast.value = true, 500);
setTimeout(() => showFirst.value = true, 1000);

</script>
<style>
.vc-carousel-item h3 {
	color: #475669;
	font-size: 14px;
	opacity: 0.75;
	line-height: 150px;
	margin: 0;
}

.vc-carousel-item:nth-child(2n) {
	background-color: #99a9bf;
}

.vc-carousel-item:nth-child(2n+1) {
	background-color: #d3dce6;
}
</style>
