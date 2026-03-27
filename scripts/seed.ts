import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const INDEX_SOURCE = resolve('scripts/myscheme.gov.in.json');
const OUTPUT_FILE = resolve('scripts/generated-schemes.json');
const BATCH_SIZE = 20;
const RETRY_ATTEMPTS = 1;
const RETRY_DELAY_MS = 500;

type SchemeIndexRecord = {
	url: string;
	slug?: string;
	schemeName?: string;
	level?: string;
	categories?: string[];
	states?: string[];
	ministries?: string;
	source?: { identifier?: string; value?: string };
	s3PublicUrl: string;
};

type SchemeDetailRecord = {
	link: string;
	schemeName?: string;
	organization?: string;
	tags?: string[];
	details?: string;
	benefits?: string[];
	eligibility?: string[];
	applicationProcess?: string;
	documentsRequired?: string[];
};

type SchemeOutput = {
	Name: string;
	SubHead: string;
	Desc: string;
	Tags: string[];
	Link: string;
};

const fetchText = async (url: string): Promise<string> => {
	const response = await fetch(url, {
		headers: {
			// Some hosts block default fetch UA; mimic browser to reduce chances of HTML challenge pages.
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
			Accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
		},
	});

	if (!response.ok) {
		throw new Error(`Request failed for ${url} with status ${response.status}`);
	}

	const contentType = response.headers.get('content-type') ?? '';
	const body = await response.text();

	if (contentType.includes('text/html') || /<html/i.test(body)) {
		throw new Error(
			`Received HTML instead of JSON from ${url}. If the host shows a challenge page, download the file manually and set SCHEMES_INDEX_FILE to the local path.`
		);
	}

	return body;
};

const fetchJson = async <T>(url: string): Promise<T> => {
	const raw = await fetchText(url);
	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse JSON from ${url}: ${message}`);
	}
};

const sleep = (ms: number): Promise<void> =>
	new Promise((resolvePromise) => {
		setTimeout(resolvePromise, ms);
	});

const fetchJsonWithRetry = async <T>(url: string, attempts: number, delayMs: number): Promise<T> => {
	let lastError: unknown;
	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			return await fetchJson<T>(url);
		} catch (error) {
			lastError = error;
			if (attempt < attempts) {
				await sleep(delayMs);
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error(`Failed to fetch ${url} after ${attempts} attempts: ${String(lastError)}`);
};

const sanitizeList = (values?: string[]): string[] =>
	(values ?? [])
		.map((value) => value?.trim())
		.filter((value): value is string => Boolean(value));

const parseIndexPayload = (raw: string): SchemeIndexRecord[] => {
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed;
		}

		if (parsed && Array.isArray((parsed as { schemes?: SchemeIndexRecord[] }).schemes)) {
			return (parsed as { schemes: SchemeIndexRecord[] }).schemes;
		}
	} catch (error) {
		// Try NDJSON fall back when JSON.parse fails.
		const lines = raw
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);

		const records: SchemeIndexRecord[] = [];
		for (const line of lines) {
			try {
				records.push(JSON.parse(line));
			} catch {
				continue;
			}
		}

		if (records.length > 0) {
			return records;
		}

		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to parse index payload as JSON or NDJSON: ${message}`);
	}

	return [];
};

const loadIndex = async (source: string): Promise<SchemeIndexRecord[]> => {
	// Treat absolute HTTP(S) as remote fetch; otherwise read from local file path.
	const isHttp = /^https?:/i.test(source);
	const raw = isHttp ? await fetchText(source) : await readFile(source, 'utf-8');
	return parseIndexPayload(raw);
};

const buildSubHead = (index: SchemeIndexRecord, detail: SchemeDetailRecord): string => {
	const parts: string[] = [];
	const level = index.level?.trim();
	const organization = detail.organization?.trim() || index.ministries?.trim();
	const coveredStates = sanitizeList(index.states).filter((state) => state.toLowerCase() !== 'all');

	if (level) {
		parts.push(`${level} scheme`);
	}

	if (organization) {
		parts.push(`by ${organization}`);
	}

	if (coveredStates.length > 0) {
		parts.push(`covering ${coveredStates.join(', ')}`);
	}

	return parts.join(' ') || detail.schemeName || index.schemeName || index.slug || 'Government Scheme';
};

const formatSection = (title: string, entries?: string[]): string | null => {
	const cleanEntries = sanitizeList(entries);
	if (cleanEntries.length === 0) {
		return null;
	}

	return `${title}: ${cleanEntries.join('; ')}`;
};

const buildDesc = (index: SchemeIndexRecord, detail: SchemeDetailRecord): string => {
	const sections: Array<string | null> = [];

	if (detail.details?.trim()) {
		sections.push(detail.details.trim());
	}

	sections.push(formatSection('Benefits', detail.benefits));
	sections.push(formatSection('Eligibility', detail.eligibility));

	if (detail.applicationProcess?.trim()) {
		sections.push(`Application Process: ${detail.applicationProcess.trim()}`);
	}

	sections.push(formatSection('Documents Required', detail.documentsRequired));

	const compactSections = sections.filter((section): section is string => Boolean(section?.trim()));
	if (compactSections.length > 0) {
		return compactSections.join('\n\n');
	}

	const fallback = [index.categories?.[0], detail.organization, index.ministries].find(Boolean);
	return fallback ? `Scheme related to ${fallback}.` : 'Government scheme details pending.';
};

const buildTags = (index: SchemeIndexRecord, detail: SchemeDetailRecord): string[] => {
	const tags = new Set<string>();

	sanitizeList(detail.tags).forEach((tag) => tags.add(tag));
	sanitizeList(index.categories).forEach((category) => tags.add(category));
	sanitizeList(index.states)
		.filter((state) => state.toLowerCase() !== 'all')
		.forEach((state) => tags.add(state));

	if (index.level?.trim()) {
		tags.add(index.level.trim());
	}

	if (index.source?.value?.trim()) {
		tags.add(index.source.value.trim());
	}

	return Array.from(tags);
};

const buildSchemeOutput = (
	index: SchemeIndexRecord,
	detail: SchemeDetailRecord
): SchemeOutput => ({
	Name: detail.schemeName || index.schemeName || index.slug || 'Government Scheme',
	SubHead: buildSubHead(index, detail),
	Desc: buildDesc(index, detail),
	Tags: buildTags(index, detail),
	Link: detail.link || index.url,
});

const chunked = <T>(items: T[], size: number): T[][] => {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
};

const main = async (): Promise<void> => {
	const indexSource = INDEX_SOURCE;
	const batchSize = Math.max(20, BATCH_SIZE);
	const attempts = Math.max(1, RETRY_ATTEMPTS);
	const delayMs = Number.isFinite(RETRY_DELAY_MS) && RETRY_DELAY_MS > 0 ? RETRY_DELAY_MS : 500;

	console.log(`Loading scheme index from ${indexSource}`);
	const schemeIndex = await loadIndex(indexSource);

	if (!Array.isArray(schemeIndex) || schemeIndex.length === 0) {
		throw new Error('No schemes found in source');
	}

	const outputs: SchemeOutput[] = [];
	let skipped = 0;
	for (const batch of chunked(schemeIndex, batchSize)) {
		const results = await Promise.all(
			batch.map(async (scheme) => {
				try {
					const detail = await fetchJsonWithRetry<SchemeDetailRecord>(scheme.s3PublicUrl, attempts, delayMs);
					return buildSchemeOutput(scheme, detail);
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					console.warn(`Skipping ${scheme.s3PublicUrl}: ${message}`);
					skipped += 1;
					return null;
				}
			})
		);

		for (const result of results) {
			if (result) {
				outputs.push(result);
			}
		}
	}

	await writeFile(OUTPUT_FILE, `${JSON.stringify(outputs, null, 2)}\n`, 'utf-8');
	console.log(`Saved ${outputs.length} schemes to ${OUTPUT_FILE} (skipped ${skipped})`);
};

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Failed to fetch schemes: ${message}`);
	process.exit(1);
});
