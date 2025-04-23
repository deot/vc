<template>
	<Collapse class="v-collapse" :model-value="[1]" accordion>
		<CollapseItem :value="1">
			<div class="v-collapse__title">
				title1
			</div>
			<template #icon="it">
				<span class="v-collapse__icon">
					{{ it.visible }}
				</span>
			</template>
			<template #content>
				<div class="v-collapse__content">
					content1
				</div>
			</template>
		</CollapseItem>
		<CollapseItem :value="2">
			<div class="v-collapse__title">
				title2
			</div>
			<template #content>
				<div class="v-collapse__content">
					content2
				</div>
			</template>
		</CollapseItem>
	</Collapse>
</template>
<script setup>
import { Collapse, CollapseItem } from '..';

</script>

<style lang="scss">
.v-collapse {
	padding: 0 100px;
	&__title {
		height: 36px;
		line-height: 36px;
		background: #e4e4e4;
		font-size: 18px;
		padding: 0 10px
	}
	&__icon {
		position: absolute;
		right: 10px;
		top: 0;
		bottom: 0;
		margin: auto 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	&__content {
		height: 100px;
		padding: 20px;
		background: #e98252
	}
}
</style>
