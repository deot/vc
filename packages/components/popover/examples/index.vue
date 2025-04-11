<template>
	<div class="demo">
		<div @click="isHover = !isHover">
			{{ trigger }}
		</div>
		<div @click="handleDynamic">
			无需插槽，动态创建
		</div>
		<div ref="parent" class="demo__container">
			<div class="demo__left" style="margin-top: 32px; margin-bottom: 32px">
				<Popover 
					:get-popup-container="getPopupContainer"
					:model-value="true" 
					:trigger="trigger"
					always
					placement="left-top"
					content="LeftTop"
					theme="dark"
					@update:modelValue="handleVisibleChange"
					@close="handleClose"
				>
					<Button class="g-btn g-m-tb-10">
						LT
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							动态改变内容{{ content }}
						</div>
					</template>
				</Popover>
				<Popover 
					v-model="isVisible"
					:portal="false"
					:trigger="trigger" 
					placement="left" 
					content="Left"
				>
					<Button class="g-btn g-m-tb-10">
						Left
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							跟随父节点
							<span @click="isVisible = false">点击我关闭弹窗</span>
						</div>
					</template>
				</Popover>
				<Popover :trigger="trigger" placement="left-bottom" content="LeftBottom">
					<Button class="g-btn g-m-tb-10">
						LB
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							Body
						</div>
					</template>
				</Popover>
			</div>
			<div class="demo__middle">
				<div class="g-jc-sb">
					<Popover 
						:get-popup-container="getPopupContainer"
						:trigger="trigger" 
						placement="top-left" 
						content="TopLeft"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							TL
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								getPopupContainer
							</div>
						</template>
					</Popover>
					<Popover 
						:portal="false"
						:trigger="trigger" 
						placement="top" 
						content="Top"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							Top
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								portal="false"
							</div>
						</template>
					</Popover>
					<Popover 
						:trigger="trigger" 
						placement="top-right" 
						content="TopRight"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							TR
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								Body
							</div>
						</template>
					</Popover>
				</div>
				<div class="g-jc-sb">
					<Popover 
						:get-popup-container="getPopupContainer"
						:trigger="trigger" 
						placement="bottom-left"
						content="BottomLeft"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							BL
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								getPopupContainer
							</div>
						</template>
					</Popover>
					<Popover 
						:portal="false"
						:trigger="trigger" 
						placement="bottom" 
						content="Bottom"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							Bottom
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								portal="false"
							</div>
						</template>
					</Popover>
					<Popover 
						:trigger="trigger" 
						placement="bottom-right"
						content="BottomRight"
						class=" g-m-lr-10"
					>
						<Button class="g-btn">
							BR
						</Button>
						<template #content>
							<div style="height: 100px; width: 200px">
								Body
							</div>
						</template>
					</Popover>
				</div>
			</div>
			<div class="demo__right" style="margin-top: 32px; margin-bottom: 32px">
				<Popover 
					:get-popup-container="getPopupContainer"
					:trigger="trigger" 
					placement="right-top" 
					content="RightTop"
				>
					<Button class="g-btn g-m-tb-10">
						RT
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							getPopupContainer
						</div>
					</template>
				</Popover>
				<Popover 
					:portal="false"
					:trigger="trigger" 
					placement="right" 
					content="Right"
				>
					<Button class="g-btn g-m-tb-10">
						Right
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							portal="false"
						</div>
					</template>
				</Popover>
				<Popover 
					:trigger="trigger" 
					placement="right-bottom" 
					content="RightBottom"
				>
					<Button class="g-btn g-m-tb-10">
						RB
					</Button>
					<template #content>
						<div style="height: 100px; width: 200px">
							Body
						</div>
					</template>
				</Popover>
			</div>
		</div>
	</div>
</template>

<script setup lang="jsx">
import { ref, computed, onMounted } from 'vue';
import { Popover } from '..'; 
import { Button } from '../../button';

const parent = ref(null);
const content = ref(1);
const isVisible = ref(false);
const isHover = ref(false);
const trigger = computed(() => {
	return isHover.value ? 'hover' : 'click';
});
let poper;

onMounted(() => {
	setTimeout(() => {
		content.value = 111111;
	}, 5000);
});

const getPopupContainer = () => {
	return parent.value;
};

const handleVisibleChange = (visible) => {
	console.log('visible: ', visible);
};

const handleClose = () => {
	console.log('close');
};

const handleDynamic = (e) => {
	if (poper && poper.isActive) return;
	poper = Popover.open({
		el: document.body,
		cName: 'only',
		triggerEl: e.target,
		hover: isHover.value,
		alone: true,
		content: () => {
			return (
				<div>222</div>
			);
		}
	});
}
</script>

<style lang="scss">
@use '../../style/helper' as *;

.g-m-lr-10 {
	margin-right: 10px;
	margin-left: 10px;
}
.g-m-tb-10 {
	margin-top: 10px;
	margin-bottom: 10px;
}
.g-jc-sb {
	display: flex;
	justify-content: space-between
}
.g-btn {
	width: 80px
}

@include block(demo) {
	padding: 50px 0 0 0;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	background: varfix(background-color); 
	height: 3000px;
	@include element(container) {
		display: flex;
		height: 400px; 
		width: auto; 
		margin-top: 200px; 
		overflow: unset; 
		position: relative; 
		background: varfix(background-color-light); 
		@include element(left) {
			display: flex;
			flex-direction: column;
			margin-right: 10px;
		}
		@include element(middle) {
			display: flex;
			flex-direction: column;
			justify-content: space-between
		}
		@include element(right) {
			display: flex;
			flex-direction: column;
			margin-left: 10px;
		}
	}
}
</style>

