export type TranslatePair = {
	[key: string]: string | string[] | TranslatePair;
};

export interface Language {
	name: string;
	vc: TranslatePair;
}
