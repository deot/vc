type Size = { originW: number; originH: number };

// 只为加载前的占位尺寸服务，放在内存里即可；按最近使用保留，避免随浏览的图片数量无限增长
const MAX = 500;

class IMGStore {
	map = new Map<string, Size>();

	has(src: string) {
		return this.map.has(src);
	}

	add(src: string, opts: Partial<Size> = {}) {
		const { originW, originH } = opts;
		// 内联图片（data:）的地址就是图片本身，不必缓存尺寸：它不经过网络，缓存只会把整份数据留在内存里
		if (!originW || !originH || src.startsWith('data:')) return;

		// 重新插入，排到最近
		this.map.delete(src);
		this.map.set(src, { originW, originH });
		if (this.map.size > MAX) {
			this.map.delete(this.map.keys().next().value!);
		}
	}

	getSize(src: string, opts: any = {}) {
		const { clientW, clientH, style, wrapperW } = opts;

		/**
		 * 1. 不存在
		 * 2. 外部传入了宽高（做了特殊处理，促使高宽至少1）
		 */
		const size = this.map.get(src);
		if (!size) return {};

		const { originW, originH } = size;

		// let scale;
		// 优先计算W
		if (style.width && clientW > 1) { // el只有width， 通常是纵向滚动
			return {
				w: clientW,
				h: clientW / originW * originH
			};
		} else if (style.height && clientH > 1) { // el只有height， 通常是横向滚动
			return {
				w: clientH / originH * originW,
				h: clientH,
			};
		} else if (wrapperW && !style.height && !style.width) { // el没有width和height， TODO: wrapperH的情况
			if (originW <= wrapperW) {
				return {
					w: originW,
					h: originH,
				};
			} else {
				return {
					w: wrapperW / originW * originW,
					h: wrapperW / originW * originH,
				};
			}
		} else {
			return {
				w: originW,
				h: originH,
			};
		}
	}
}

export default new IMGStore();
