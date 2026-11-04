/** @jsxImportSource vue */

import { computed, defineComponent, onMounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useLocale } from '../../../locale';
import { useReveal } from '../reveal';
import { props as slideProps } from '../slide-props';
import { createObjectUrl, getDownloadUrl, getFileUrl, getFrameSrc } from './utils';

const COMPONENT_NAME = 'vc-file-slide';

export const FileSlide = defineComponent({
	name: COMPONENT_NAME,
	props: slideProps,
	setup(props) {
		const { t } = useLocale();
		const reveal = useReveal();
		// 只在第一次成为当前页时挂 iframe，离开后保留，避免来回切换重复加载
		const isShown = ref(props.active);
		watch(() => props.active, v => v && (isShown.value = true));

		// data: 地址转成的 blob: 地址，地址变化或卸载时释放
		const objectUrl = shallowRef<string>();
		watchEffect((onCleanup) => {
			const url = createObjectUrl(props.row.source);
			objectUrl.value = url;
			url && onCleanup(() => URL.revokeObjectURL(url));
		});

		const fileUrl = computed(() => getFileUrl(props.row, objectUrl.value));
		const frameSrc = computed(() => getFrameSrc(props.row, fileUrl.value));
		const src = computed(() => (isShown.value ? frameSrc.value : void 0));
		const downloadUrl = computed(() => getDownloadUrl(props.row));
		const openUrl = computed(() => frameSrc.value || fileUrl.value);

		onMounted(() => reveal?.ready());

		return () => (
			<div class={['vc-file-slide', { 'has-frame': !!src.value }]}>
				<div class="vc-file-slide__meta">
					<div class="vc-file-slide__file">
						<p class="vc-file-slide__name">{props.row.name}</p>
					</div>
					{
						(openUrl.value || downloadUrl.value) && (
							<div class="vc-file-slide__actions">
								{
									openUrl.value && (
										<a
											class="vc-file-slide__open"
											href={openUrl.value}
											target="_blank"
											rel="noopener noreferrer"
										>
											{t('vc.FilePreview.open')}
										</a>
									)
								}
								{
									downloadUrl.value && (
										<a
											class="vc-file-slide__download"
											href={downloadUrl.value}
											download={props.row.name}
											target="_blank"
											rel="noopener noreferrer"
										>
											{t('vc.FilePreview.download')}
										</a>
									)
								}
							</div>
						)
					}
				</div>
				{ src.value && <iframe class="vc-file-slide__frame" src={src.value} title={props.row.name} /> }
			</div>
		);
	}
});
