<template>
	<div class="audit-stack">
		<div class="audit-sample" data-state="角标">
			<div class="audit-sample__label">数字 / 封顶 / 圆点 / 文字 / 自定义</div>
			<div class="audit-row">
				<Badge :value="9"><span :style="BOX" /></Badge>
				<Badge :value="120"><span :style="BOX" /></Badge>
				<Badge dot><span :style="BOX" /></Badge>
				<Badge value="NEW"><span :style="BOX" /></Badge>
				<Badge>
					<span :style="BOX" />
					<template #dot>
						<Icon type="time" />
					</template>
				</Badge>
				<Badge :value="16" />
			</div>
		</div>
		<div class="audit-sample" data-state="状态点">
			<div class="audit-sample__label">default / pending / success / warning / error</div>
			<div class="audit-row">
				<Badge v-for="status in STATUSES" :key="status" :status="status" :label="status" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { Badge, Icon } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const STATUSES = ['default', 'pending', 'success', 'warning', 'error'];
// 左边留出空间：右上角的徽标会伸出方块外
const BOX = { display: 'block', width: '40px', height: '40px', marginLeft: '16px', background: 'var(--vc-color-neutral)', borderRadius: '4px' };
</script>
