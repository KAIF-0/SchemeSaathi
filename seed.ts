import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import upstashIndexService from './src/services/upstash-index.service';
import UpstashConfig from './src/config/upstash';

interface SchemeRecord {
	Name: string;
	SubHead?: string;
	Desc?: string;
	Tags?: string[];
	Link?: string;
}

type SeedPayload = SchemeRecord[] | { schemes?: SchemeRecord[] };

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_DATA_FILE = 'schemes.ts';

function toSearchableText(scheme: SchemeRecord): string {
	const tags = Array.isArray(scheme.Tags) ? scheme.Tags.join(', ') : '';

	return [
		`Name: ${scheme.Name}`,
		`Department: ${scheme.SubHead ?? ''}`,
		`Description: ${scheme.Desc ?? ''}`,
		`Tags: ${tags}`,
	]
		.join('\n')
		.trim();
}

function normalizeSchemes(payload: SeedPayload): SchemeRecord[] {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (payload && Array.isArray(payload.schemes)) {
		return payload.schemes;
	}

	return [];
}

async function loadSchemes(filePath: string): Promise<SchemeRecord[]> {
	const raw = await readFile(filePath, 'utf-8');
	const parsed = JSON.parse(raw) as SeedPayload;
	const schemes = normalizeSchemes(parsed);

	return schemes.filter((scheme) => typeof scheme?.Name === 'string' && scheme.Name.trim().length > 0);
}

async function seedSchemes(): Promise<void> {
	const cliPath = process.argv[2];
	const envPath = Bun.env.SCHEMES_DATA_FILE ?? process.env.SCHEMES_DATA_FILE;
	const sourcePath = resolve(cliPath || envPath || DEFAULT_DATA_FILE);

	const schemes = await loadSchemes(sourcePath);

	if (schemes.length === 0) {
		throw new Error(`No valid schemes found in ${sourcePath}`);
	}

	const vectors = schemes.map((scheme, index) => ({
		id: `scheme_${index + 1}`,
		data: toSearchableText(scheme),
		metadata: {
			name: scheme.Name,
			subHead: scheme.SubHead ?? '',
			desc: scheme.Desc ?? '',
			tags: scheme.Tags ?? [],
			link: scheme.Link ?? '',
		},
	}));

	for (let offset = 0; offset < vectors.length; offset += DEFAULT_BATCH_SIZE) {
		const batch = vectors.slice(offset, offset + DEFAULT_BATCH_SIZE);
		await upstashIndexService.schemeIndex.upsert(batch, { namespace: UpstashConfig.SCHEMES_NAMESPACE });
	}

	console.log(
		`Seeded ${vectors.length} schemes to namespace '${UpstashConfig.SCHEMES_NAMESPACE}' from ${sourcePath}`
	);
}

seedSchemes().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Schemes seed failed: ${message}`);
	process.exit(1);
});
