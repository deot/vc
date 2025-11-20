<template>
	<Scroller class="demo" :native="false">
		<div style=" display: flex;height: 100vh;">
			<div style="display: flex; flex: 0 0 200px;">left</div>
			<div style="display: flex; width: 100%; height: 100%; flex-direction: column;">
				<div>header</div>
				<div style=" min-width: 600px; overflow: hidden;flex: 1;">
					<Resizer style="padding: 40px; background: gray;" @resize="handleResize">
						<template #default="{ style, height, width }">
							<Scroller style="border: 1px solid red; box-sizing: border-box;" :style="style">
								<div v-for="item in 1000" :key="item">
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
								</div>
							</Scroller>
						</template>
					</Resizer>
				</div>
				<div>footer</div>
			</div>
		</div>
	</Scroller>
</template>
<script setup>
import { Resizer } from '..';
import { Scroller } from '../../scroller';

const handleResize = (e) => {
	console.log(e);
};
</script>
<style>
body {
	margin: 0;
}

.demo {
	position: relative;
	width: 100vw;
	height: 100vh;
	background: #E8E9EE;
}
</style>
