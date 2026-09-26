import { VcError } from '../vc/error';

const svgReg = /.*<svg>(.*)<\/svg>.*/g;
const basicReg = /.*id="icon-([^"]+).*viewBox="([^"]+)(.*)/g;
const symbolReg = /<symbol.*?<\/symbol>/gi;
const pathReg = /<path.*?<\/path>/gi;
const dReg = /.*d="([^"]+).*/g;
const fillReg = /.*fill="([^"]+).*/g;
const basicUrl = '//at.alicdn.com/t/font_1119857_u0f4525o6sd.js';
const prefix = '@deot/vc-icon:';
const IS_DEV = process.env.NODE_ENV === 'development';

const IS_SERVER = typeof document === 'undefined';
class Manager {
	icons: { [key: string]: { viewBox: string; path: string[] } } = {};

	events: { [key: string]: Function[] } = {};

	sourceStatus: { [key: string]: Promise<void> } = {};

	basicStatus?: Promise<void>;

	// 进行中的图标集加载数
	loading = 0;

	constructor() {
		/**
		 * 初始化加载, Storage.version设置问题需要使用异步
		 */
		setTimeout(() => {
			this.basicStatus = this.load(basicUrl);
		}, 0);
	}

	load(url: string): Promise<void> {
		if (url in this.sourceStatus) return this.sourceStatus[url];

		this.loading++;
		this.sourceStatus[url] = new Promise<void>((resolve, reject) => {
			(async () => {
				try {
					if (IS_SERVER || !/.js$/.test(url)) {
						return reject(new VcError('icon', 'invaild url'));
					}
					const key = `${prefix}${url}`;

					const cache = window.localStorage.getItem(key);
					let icons = JSON.parse(cache || '""') as typeof IconManager['icons'];

					/* istanbul ignore next -- @preserve */
					if (!icons) {
						const data = await new Promise<string>((resolve$, reject$) => {
							const request = new XMLHttpRequest();
							request.onreadystatechange = () => {
								if (request.readyState !== 4) return;
								if (request.status >= 200 && request.status <= 400) {
									resolve$(request.responseText || request.response);
								} else {
									// 请求失败也要结束加载：否则加载计数不归零，等待上限一直不生效
									reject$(`load ${url} failed (${request.status})`);
								}
							};
							request.open('GET', `${window.location.protocol.replace(/[^:]+/, 'https')}${url}`);
							request.send();
						});

						// 等待解析
						icons = await this.parser(data, url);

						try {
							window.localStorage.setItem(key, JSON.stringify(icons));
						} catch {
							// 内存溢出，删除老缓存, 延迟3秒清理，重新设置
							setTimeout(() => {
								this.clearResource();
								// 如果还存在溢出，项目内自行处理吧
								window.localStorage.setItem(key, JSON.stringify(icons));
							}, 3000);
						}
					}

					// 重构图标
					this.icons = {
						...this.icons,
						...icons,
					};
					// 执行
					Object.keys(this.events).forEach((type) => {
						const fns = this.events[type];
						if (this.icons[type] && fns) {
							fns.forEach((fn: Function) => fn());
							delete this.events[type];
						}
					});

					// 结束
					resolve();
				} catch (e) {
					/* istanbul ignore next -- @preserve */
					reject(new VcError('icon', e));
				}
			})();
		});

		// 加载结束（成功或失败）：图标集都已加载完时，检查仍在等待的 type
		const settle = () => {
			this.loading--;
			/* istanbul ignore else -- @preserve */
			if (!IS_SERVER) {
				Object.keys(this.events).forEach((type) => {
					this.limit(type) && new VcError('icon', `${type} nonexistent`);
				});
			}
		};
		this.sourceStatus[url].then(settle, settle);
		return this.sourceStatus[url];
	}

	parser(svgStr: string, url: string): Promise<typeof IconManager['icons']> {
		return new Promise((resolve, reject) => {
			const icons = {};
			setTimeout(() => {
				try {
					/* istanbul ignore next -- @preserve */
					IS_DEV && console.time(url);
					svgStr.replace(svgReg, '$1')?.match(symbolReg)?.forEach(
						(i: string) => i.replace(basicReg, (_: string, ...args: any[]): string => {
							const [$1, $2, $3] = args;
							icons[`${$1}`] = {
								viewBox: $2,
								path: $3?.match(pathReg)?.map((j: string) => ({
									d: j.replace(dReg, '$1'),
									fill: fillReg.test($3) ? j.replace(fillReg, '$1') : ''
								}))
							};
							return '';
						})
					);
					/* istanbul ignore next -- @preserve */
					IS_DEV && console.timeEnd(url);
					resolve(icons);
				} catch (e) {
					/* istanbul ignore next -- @preserve */
					reject(new VcError('icon', e));
				}
			}, 0);
		});
	}

	on(type?: string, fn?: Function) {
		/* istanbul ignore next -- @preserve */
		if (typeof type !== 'string' || typeof fn !== 'function') return this;

		/* istanbul ignore else -- @preserve */
		if (this.limit(type) && !IS_SERVER) {
			throw new VcError('icon', `${type} nonexistent`);
		}

		(this.events[type] = this.events[type] || []).push(fn);

		return this;
	}

	/**
	 * 等待队列上限：超出时清空该 type 的等待队列
	 * - 客户端: Icon 卸载或切换 type 时会 off, 队列长度即当前仍挂载且在等待该 type 的图标数,
	 *   图标集都已加载完时仍有 100 个图标在等待同一 type 基本意味着该 type 不存在(如拼写错误或未加载对应图标集), 由调用方提示;
	 *   图标集加载中(含基础图标集尚未开始加载)时不判定: 长列表首屏会有大量同一 type 的图标同时等待, 加载结束时再检查
	 * - 服务端: 图标不会加载且不执行卸载钩子, 单例上的队列会跨请求累积, 这里清空以限制内存
	 * @param type 图标类型
	 * @returns 是否超出上限
	 */
	private limit(type: string) {
		const loading = !this.basicStatus || this.loading > 0;
		if ((this.events[type]?.length || 0) < 100 || (!IS_SERVER && loading)) return false;
		delete this.events[type];
		return true;
	}

	off(type?: string, fn?: Function) {
		/* istanbul ignore next -- @preserve */
		if (typeof type !== 'string' || typeof fn !== 'function') return this;

		this.events[type] = this.events[type]?.filter((i: Function) => i != fn);

		return this;
	}

	/* istanbul ignore next -- @preserve */
	private clearResource() {
		const needs = Object.keys(this.sourceStatus);
		Object.keys(window.localStorage).forEach((item) => {
			if (item.includes(prefix)) {
				const key = item.split(prefix).pop();
				key && !needs.includes(key)
				&& window.localStorage.removeItem(item); // 这里需要使用localStorage
			}
		});
	}
}

export const IconManager = new Manager();
