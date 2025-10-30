/** @jsxImportSource vue */

import { nextTick, defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
import { props as snapshotProps } from './snapshot-props';
import { VcInstance, VcError } from '../vc/index';
import { Message } from '../message/index';

const COMPONENT_NAME = 'vc-snapshot';

export const Snapshot = defineComponent({
	name: COMPONENT_NAME,
	props: snapshotProps,
	emits: ['ready'],
	setup(props, { emit, slots, expose }) {
		let snapDOM: any;
		const instance = getCurrentInstance()!;
		const current = ref<any>();
		const snapshot = ref();

		const refresh = async () => {
			await nextTick();
			snapshot.value = await snapDOM(
				current.value,
				{
					fast: false, // dom太大时会卡死一会儿
					...VcInstance.options.Snapshot?.options,
					...props.options
				}
			);

			return snapshot.value;
		};

		const onLoad = () => {
			return props.showLoading && Message.loading('正在生成...');
		};

		const onLoaded = (ctx: any) => {
			ctx?.destroy?.();
		};

		const toDataURL = async () => {
			const loadContext = onLoad();
			try {
				await refresh();
				return snapshot.value.toRaw();
			} finally {
				onLoaded(loadContext);
			}
		};

		const downloadByDefault = async (options: any) => {
			await refresh();
			return snapshot.value.download(options);
		};

		const download = async (options: any) => {
			const loadContext = onLoad();
			const downloadByUser = props.download || VcInstance.options.Snapshot?.download || (() => false);
			const skip = downloadByUser(instance, options);

			const done = async (v: boolean) => {
				try {
					v || await downloadByDefault(options);
				} finally {
					onLoaded(loadContext);
				}
			};

			if (skip && skip.then) {
				let skip$ = false;
				skip
					.then((v: any) => {
						skip$ = typeof v === 'undefined' ? true : !!v;
						return v;
					})
					.finally(() => done(skip$));
				return;
			}

			done(skip);
		};

		expose({
			snapshot,
			refresh,
			toDataURL,
			download
		});

		onMounted(async () => {
			try {
				snapDOM = (window as any).snapdom || await import('@zumer/snapdom');
				snapDOM = snapDOM.snapdom || snapDOM;

				!props.lazy && (await refresh());

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
