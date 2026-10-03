<template>
	<div class="audit-stack audit-carousel">
		<div v-for="dots in ['bottom', 'outside']" :key="dots" class="audit-sample" :data-state="`指示器 ${dots} · 箭头 hover`">
			<div class="audit-sample__label">指示器 {{ dots }} · 箭头 hover</div>
			<component :is="mobile ? MCarousel : Carousel" :dots="dots" :height="150" :autoplay="false" arrow="always">
				<component :is="mobile ? MCarouselItem : CarouselItem" v-for="index in 3" :key="index" :name="String(index)" :label="`主题 ${index}`">
					<img :src="svgImage(`Slide ${index}`, index === 2 ? '#1DB88C' : '#456CF6')"
						:alt="`Slide ${index}`" class="audit-carousel__image">
				</component>
			</component>
		</div>
		<div v-if="!mobile" class="audit-sample" data-state="卡片模式遮罩">
			<div class="audit-sample__label">卡片模式遮罩</div>
			<Carousel card :height="130" :autoplay="false">
				<CarouselItem v-for="index in 3" :key="index" :name="String(index)">
					<img :src="svgImage(String(index))" :alt="String(index)" class="audit-carousel__image is-card">
				</CarouselItem>
			</Carousel>
		</div>
	</div>
</template>
<script setup>
import { Carousel, CarouselItem, MCarousel, MCarouselItem } from '@deot/vc';
import { svgImage } from '../sample';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
