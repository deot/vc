import { getCurrentInstance } from 'vue';

export const getInstance = (componentName: string, privateKey: string) => {
	const instance = getCurrentInstance()!;
	const regex = new RegExp(`${componentName}$`);

	let parent = instance.parent;
	/* istanbul ignore next -- @preserve */
	while (
		parent
		&& !(parent?.type?.name && regex.test(parent.type.name))
		&& (!privateKey || !parent?.[privateKey] || !parent?.proxy?.[privateKey])
	) {
		parent = parent.parent || (parent?.type as any)?.parent; // 和portal临时约定
	}
	return parent;
};
