import upstashIndexService from '../src/services/upstash-index.service';

async function cleanupSchemesIndex(): Promise<void> {
    const index = upstashIndexService.schemeIndex;
    const namespacesBefore = await index.listNamespaces();

    console.log(`Scheme namespaces before cleanup: ${namespacesBefore.length > 0 ? namespacesBefore.join(', ') : '(none)'}`);

    await index.reset();
    console.log('Reset default scheme namespace');

    for (const namespace of namespacesBefore) {
        if (!namespace) {
            continue;
        }

        await index.reset({ namespace });
        console.log(`Reset scheme namespace: ${namespace}`);
    }

    const namespacesAfter = await index.listNamespaces();
    console.log(`Scheme namespaces after cleanup: ${namespacesAfter.length > 0 ? namespacesAfter.join(', ') : '(none)'}`);
    console.log('Schemes index cleanup complete: all scheme vectors removed.');
}

cleanupSchemesIndex().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Schemes index cleanup failed: ${message}`);
    process.exit(1);
});
