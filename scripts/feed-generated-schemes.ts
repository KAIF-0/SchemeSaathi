import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import upstashIndexService from '../src/services/upstash-index.service';
import UpstashConfig from '../src/config/upstash';

const PRIMARY_INPUT = resolve('scripts/generated-schemes.cleaned.json');
const FALLBACK_INPUT = resolve('scripts/generated-schemes.json');
const BATCH_SIZE = 100;

type Scheme = {
	Name: string;
	SubHead?: string;
	Desc?: string;
	Tags?: string[];
	Link?: string;
};

type Vector = {
	id: string;
	data: string;
	metadata: {
		name: string;
		subHead: string;
		desc: string;
		tags: string[];
		link: string;
	};
};

const toSearchableText = (scheme: Scheme): string => {
	const tags = Array.isArray(scheme.Tags) ? scheme.Tags.join(', ') : '';
	return [
		`Name: ${scheme.Name}`,
		`Description: ${scheme.Desc ?? ''}`,
		`Summary: ${scheme.SubHead ?? ''}`,
		`Tags: ${tags}`,
	]
		.join('\n')
		.trim();
};

const loadSchemes = async (): Promise<Scheme[]> => {
	try {
		const raw = await readFile(PRIMARY_INPUT, 'utf-8');
		return JSON.parse(raw) as Scheme[];
	} catch {
		const raw = await readFile(FALLBACK_INPUT, 'utf-8');
		return JSON.parse(raw) as Scheme[];
	}
};

const chunked = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
};

const main = async (): Promise<void> => {
	const schemes = await loadSchemes();

	if (!Array.isArray(schemes) || schemes.length === 0) {
		throw new Error('No schemes found to feed');
	}

	const vectors: Vector[] = schemes
		.filter((scheme) => scheme?.Name)
		.map((scheme, index) => ({
			id: `scheme_${index + 1}`,
			data: toSearchableText(scheme),
			metadata: {
				name: scheme.Name,
				subHead: scheme.SubHead ?? '',
				desc: scheme.Desc ?? '',
				tags: Array.isArray(scheme.Tags) ? scheme.Tags : [],
				link: scheme.Link ?? '',
			},
		}));

	let fed = 0;
	for (const batch of chunked(vectors, BATCH_SIZE)) {
		await upstashIndexService.schemeIndex.upsert(batch, { namespace: UpstashConfig.SCHEMES_NAMESPACE });
		fed += batch.length;
		console.log(`Upserted ${fed}/${vectors.length}`);
	}

	console.log(`Completed upserting ${fed} schemes to namespace '${UpstashConfig.SCHEMES_NAMESPACE}'`);
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Failed to feed schemes: ${message}`);
	process.exit(1);
});
