/** @jsxImportSource vue */

import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch, watchEffect } from 'vue';
import { useLocale } from '../../../locale';
import { copyToClipboard } from '../../../clipboard/utils';
import { allowedUrl } from '../../utils';
import { useReveal } from '../reveal';
import { props as slideProps } from '../slide-props';
import { createObjectUrl, getDownloadUrl, getFileUrl, getFrameSrc } from './utils';

const COMPONENT_NAME = 'vc-file-slide';

export const FileSlide = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...slideProps,
		/**
		 * 移动端：「新窗口打开」「下载」统一为「复制链接」（手机浏览器多不认 download，内嵌浏览器常拦截新窗口）；
		 * 只有 http(s) 地址可以复制，blob:、data: 地址仍为下载
		 */
		mobile: Boolean
	},
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
		// 移动端复制文件本身的地址（不是在线预览包装后的地址）
		const copyUrl = computed(() => (props.mobile ? allowedUrl(props.row.source, ['http:', 'https:']) : void 0));

		// 复制后按钮原地显示「复制成功」，两秒后恢复
		const isCopied = ref(false);
		let timer: ReturnType<typeof setTimeout> | undefined;
		const handleCopy = () => {
			if (!copyToClipboard(copyUrl.value)) return;
			isCopied.value = true;
			clearTimeout(timer);
			timer = setTimeout(() => isCopied.value = false, 2000);
		};
		onBeforeUnmount(() => clearTimeout(timer));

		onMounted(() => reveal?.ready());

		return () => (
			<div class={['vc-file-slide', { 'has-frame': !!src.value }]}>
				<div class="vc-file-slide__meta">
					<div class="vc-file-slide__file">
						<p class="vc-file-slide__name">{props.row.name}</p>
					</div>
					{
						copyUrl.value
							? (
									<div class="vc-file-slide__actions">
										<button type="button" class="vc-file-slide__copy" aria-live="polite" onClick={handleCopy}>
											{isCopied.value ? t('vc.Clipboard.copySuccess') : t('vc.FilePreview.copyLink')}
										</button>
									</div>
								)
							: (openUrl.value || downloadUrl.value) && (
									<div class="vc-file-slide__actions">
										{
											openUrl.value && !props.mobile && (
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
