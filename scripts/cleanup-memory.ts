import upstashIndexService from '../src/services/upstash-index.service';

async function cleanupMemoryIndex(): Promise<void> {
    const index = upstashIndexService.memoryIndex;
    const namespacesBefore = await index.listNamespaces();

    console.log(`Memory namespaces before cleanup: ${namespacesBefore.length > 0 ? namespacesBefore.join(', ') : '(none)'}`);

    await index.reset();
    console.log('Reset default memory namespace');

    for (const namespace of namespacesBefore) {
        if (!namespace) {
            continue;
        }

        await index.reset({ namespace });
        console.log(`Reset memory namespace: ${namespace}`);
    }

    const namespacesAfter = await index.listNamespaces();
    console.log(`Memory namespaces after cleanup: ${namespacesAfter.length > 0 ? namespacesAfter.join(', ') : '(none)'}`);
    console.log('Memory index cleanup complete: all user-memory vectors removed.');
}

cleanupMemoryIndex().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Memory index cleanup failed: ${message}`);
    process.exit(1);
});
