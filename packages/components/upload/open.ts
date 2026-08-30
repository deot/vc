import type { Component } from 'vue';
import { Portal } from '../portal';
import type { UploadOpenOptions } from './upload-props';
import type { UploadCallback } from './types';

export const createOpen = (component: Component, portalName: string) => {
	const portal = new Portal(component, {
		leaveDelay: 0,
		name: portalName
	});

	return (options: UploadOpenOptions) => {
		const {
			silent = false,
			onComplete = () => {},
			...rest
		} = options;

		const leaf = portal.popup({
			...rest,
			onComplete: (({ result }) => {
				onComplete({ result });
				if (result.total === result.failed) {
					leaf.reject(result);
				} else {
					leaf.resolve(result);
				}
			}) satisfies UploadCallback['onComplete']
		}, {});
		!silent && leaf.wrapper?.click();

		return leaf;
	};
};
