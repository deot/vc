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

	constructor() {
		/**
		 * 初始化加载, Storage.version设置问题需要使用异步
		 */
		setTimeout(() => {
			this.basicStatus = this.load(basicUrl);
		}, 0);
	}

	load(url: string): Promise<void> {
		this.sourceStatus[url] = this.sourceStatus[url] || new Promise<void>((resolve, reject) => {
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
						const data = await new Promise<string>((resolve$) => {
							const request = new XMLHttpRequest();
							request.onreadystatechange = () => {
								if (
									request.readyState === 4
									&& request.status >= 200
									&& request.status <= 400
								) {
									resolve$(request.responseText || request.response);
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

		this.events[type] = this.events[type] || [];

		if (this.events[type].length >= 100) {
			delete this.events[type];

			/* istanbul ignore else -- @preserve */
			if (!IS_SERVER) {
				throw new VcError('icon', `${type} nonexistent`);
			}
		}

		this.events[type].push(fn);

		return this;
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
