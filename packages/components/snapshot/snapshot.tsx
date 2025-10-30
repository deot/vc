/** @jsxImportSource vue */

import { defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
import { props as snapshotProps } from './snapshot-props';
import { VcInstance, VcError } from '../vc/index';

const COMPONENT_NAME = 'vc-snapshot';

export const Snapshot = defineComponent({
	name: COMPONENT_NAME,
	props: snapshotProps,
	emits: ['ready'],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;
		const current = ref<any>();
		const snapdom = ref();

		// 网络的图片如果没有加上crossOrigin，且没有放在第一个就会出现问题（Safari）
		const refresh = async () => {
			if (!props.crossOrigin) return;
			const transformSource = props.source || VcInstance.options.Snapshot?.source || ((v: any) => v);

			return Promise.all(Array.from(current.value.querySelectorAll('img')).map((node: any) => {
				return new Promise<any>((resolve) => {
					(async () => {
						let url;
						try {
							url = await transformSource(node.src, 'image');
						} catch (e) {
							console.error(e);
						}

						const image = new Image();
						image.crossOrigin = props.crossOrigin;
						image.src = `${url}?=${new Date().getTime()}`; // 强制不缓存
						image.onload = () => {
							node.src = image.src;
							resolve(1);
						};
						image.onerror = () => resolve(0);
					})();
				});
			}));
		};

		const toDataURL = async () => {
			await refresh();
			return snapdom.value.toRaw();
		};

		const download = async (options: any) => {
			await refresh();
			const _download = props.download || VcInstance.options.Snapshot?.download || (() => false);

			const allow = _download(instance, options);

			if (allow && allow.then) {
				allow.catch(() => {
					snapdom.value.download(options);
				});
				return;
			}

			allow || snapdom.value.download(options);
		};

		expose({
			snapdom,
			refresh,
			toDataURL,
			download
		});

		onMounted(async () => {
			try {
				let snapDOM = (window as any).snapdom || await import('@zumer/snapdom');
				snapDOM = snapDOM.snapdom || snapDOM;

				snapdom.value = await snapDOM(current.value, props.options);

				emit('ready', {
					instance,
					dependencies: {
						snapDOM
					}
				});
			} catch (e) {
				throw new VcError('snapshot', e);
			}
		});

		return () => {
			return (
				<div ref={current} class="vc-snapshot">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
