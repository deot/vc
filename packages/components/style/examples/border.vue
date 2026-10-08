<template>
	<div class="v-border">
		<p>
			devicePixelRatio: {{ ratio }}（调整浏览器缩放，描边应始终是完整、等粗的实线）
		</p>

		<h4>四边 + 圆角（宿主为小数尺寸）</h4>
		<div class="v-border__row">
			<div class="v-border__box is-all">8</div>
			<div class="v-border__box is-all is-square">0</div>
			<div class="v-border__box is-circle">50%</div>
		</div>

		<h4>单边</h4>
		<div class="v-border__row">
			<div class="v-border__box is-top">top</div>
			<div class="v-border__box is-right">right</div>
			<div class="v-border__box is-bottom">bottom</div>
			<div class="v-border__box is-left">left</div>
			<div class="v-border__box is-top-bottom">top + bottom</div>
		</div>

		<h4>外层 overflow: hidden</h4>
		<div class="v-border__row">
			<div class="v-border__clip">
				<div class="v-border__box is-all">8</div>
			</div>
			<div class="v-border__clip">
				<div class="v-border__box is-bottom">bottom</div>
			</div>
		</div>

		<h4>紧邻排列</h4>
		<div class="v-border__row is-adjacent">
			<div v-for="item in 6" :key="item" class="v-border__box is-all is-square">{{ item }}</div>
		</div>
	</div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const ratio = ref(window.devicePixelRatio);
const sync = () => {
	ratio.value = window.devicePixelRatio;
};

onMounted(() => window.addEventListener('resize', sync));
onBeforeUnmount(() => window.removeEventListener('resize', sync));
</script>

<style lang="scss">
@use '../helper' as *;

$color: #f5222d;

.v-border {
	padding: 40px;
	font-size: 12px;

	h4 {
		margin: 24px 0 12px;
	}

	&__row {
		display: flex;
		gap: 24.3px;
		align-items: flex-start;

		&.is-adjacent {
			gap: 0;
		}
	}

	&__clip {
		overflow: hidden;
	}

	&__box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 101.3px;
		height: 31.7px;
		background: #fff;

		&.is-all {
			border-radius: 8px;

			@include border('', $color, 8);
		}

		&.is-square {
			border-radius: 0;

			&::after {
				border-radius: 0;
			}
		}

		&.is-circle {
			width: 47.7px;
			height: 47.7px;
			border-radius: 50%;

			@include border('', $color, 50%);
		}

		&.is-top {
			@include border(top, $color);
		}

		&.is-right {
			@include border(right, $color);
		}

		&.is-bottom {
			@include border(bottom, $color);
		}

		&.is-left {
			@include border(left, $color);
		}

		&.is-top-bottom {
			@include border(top, $color);
			@include border(bottom, $color);
		}
	}
}
</style>
