<!-- 弹层中的表格：随 Modal 的展开动画一起渲染，尺寸与动画结束后一致 -->
<template>
	<div style="padding: 30px;">
		<Button type="primary" @click="handleOpen">打开弹层</Button>
	</div>
</template>
<script setup lang="jsx">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';
import { Modal } from '../../modal';
import { Portal } from '../../portal';

const dataSource = Array.from({ length: 100 }, (_, index) => ({
	id: index + 1,
	name: `条目 ${index + 1}`,
	desc: `这是条目 ${index + 1} 的说明文字，用于展示较长内容的换行与截断。`
}));

const Wrapper = defineComponent({
	name: 'table-popup-wrapper',
	emits: ['portal-fulfilled', 'portal-rejected'],
	setup(_, { emit }) {
		const isActive = ref(false);
		onMounted(() => (isActive.value = true));

		return () => (
			<Modal
				modelValue={isActive.value}
				title="弹层中的表格"
				width={900}
				{...{ 'onUpdate:modelValue': v => (isActive.value = v) }}
				onOk={() => emit('portal-fulfilled')}
				onCancel={() => emit('portal-rejected')}
			>
				<Table primaryKey="id" border stripe showSummary maxHeight={400} data={dataSource}>
					<TableColumn type="selection" fixed="left" width={60} />
					<TableColumn prop="name" label="名称" fixed="left" width={160} />
					<TableColumn prop="desc" label="说明" minWidth={320} line={1} />
					<TableColumn prop="id" label="编号" align="right" width={120} />
				</Table>
			</Modal>
		);
	}
});

const AnyModal = new Portal(Wrapper);
const handleOpen = () => {
	window.$perf?.reset();
	AnyModal.popup();
};

// 右上角的性能读数：每次打开弹层前清零
window.$perf?.observe();
onBeforeUnmount(() => window.$perf?.disconnect());
</script>
