<!-- 仅展示最基本的用法 -->
<template>
	<div style="padding: 20px; height: 100vh; -webkit-overflow-scrolling: touch; overflow: auto">
		<br>
		<br>
		<br>
		<br>
		<br>
		<div>
			<MCarousel :height="150" :autoplay="true" dots="bottom">
				<MCarouselItem v-for="item in 4" :key="item">
					<h3>{{ item }}</h3>
				</MCarouselItem>
			</MCarousel>
		</div>
		<br>
		<br>
		<br>
		<div>
			<MCarousel :t="4000" :height="200" card>
				<MCarouselItem v-for="item in 6" :key="item">
					<h3 class="medium">
						{{ item }}
					</h3>
				</MCarouselItem>
			</MCarousel>
		</div>
		<br>
		<br>
		<br>
		<div>
			<MCarousel :autoplay="false" :height="200" vertical dots="bottom">
				<MCarouselItem v-for="item in 3" :key="item">
					<h3 class="medium">
						{{ item }}
					</h3>
				</MCarouselItem>
			</MCarousel>
		</div>

		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
		<br>
	</div>
</template>
<script setup>
import { MCarousel, MCarouselItem } from '../index.m';

</script>
<style>
.vcm-carousel-item h3 {
	color: #475669;
	font-size: 14px;
	opacity: 0.75;
	line-height: 150px;
	margin: 0;
}

.vcm-carousel-item:nth-child(2n) {
	background-color: #99a9bf;
}

.vcm-carousel-item:nth-child(2n+1) {
	background-color: #d3dce6;
}
</style>
