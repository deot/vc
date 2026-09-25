<template>
	<div class="select-portal-demo">
		<p>
			portal 控制下拉的挂载位置：true（默认）挂到 body，滚动容器滚动时由 JS 跟随，触发器滚出容器可视区时隐藏；
			false 挂到组件根节点内，随容器一起滚动，超出容器的部分被裁剪。打开后滚动灰色容器对比。
		</p>
		<div class="select-portal-demo__row">
			<div
				v-for="portal in [true, false]"
				:key="String(portal)"
				:data-portal="String(portal)"
				class="select-portal-demo__col"
			>
				<p>portal = {{ portal }}</p>
				<div class="select-portal-demo__scroll">
					<div class="select-portal-demo__inner">
						<Select
							v-model="values[String(portal)]"
							:data="cityList"
							:portal="portal"
							:portal-class="`select-portal-demo__popup-${portal}`"
							@ready="handleReady(portal)"
						/>
					</div>
				</div>
				<p>下拉挂载位置：<b data-mount>{{ mounts[String(portal)] }}</b></p>
			</div>
		</div>
	</div>
</template>

<script setup>
import { reactive } from 'vue';
import { Select } from '..';
import { cityList } from './basic/data';

const values = reactive({ true: '', false: '' });
const mounts = reactive({ true: '（未打开）', false: '（未打开）' });

// ready 在弹层组件挂载时触发，此时尚未插入文档，下一帧再读取
const handleReady = portal => requestAnimationFrame(() => {
	const parent = document.querySelector(`.select-portal-demo__popup-${portal}`)?.parentElement;
	mounts[String(portal)] = parent === document.body ? 'body' : '组件根节点内';
});
</script>

<style lang="scss">
.select-portal-demo {
	padding: 40px;

	&__row {
		display: flex;
		gap: 40px;
	}

	&__col {
		width: 280px;
	}

	&__scroll {
		height: 160px;
		overflow: auto;
		background: #f5f5f5;
	}

	&__inner {
		height: 480px;
		padding: 40px 20px 0;
	}
}
</style>
