import { END, START, StateGraph } from '@langchain/langgraph';
import { AgentStateAnnotation, type AgentInput } from './state';
import { retrieveMemory } from './nodes/retrieveMemory';
import { validateProfile } from './nodes/validateProfile';
import { intentClassifier } from './nodes/intentClassifier';
import { schemeRAG } from './nodes/schemeRAG';
import { respond } from './nodes/respond';
import { updateMemory } from './nodes/updateMemory';

const graphBuilder = new StateGraph(AgentStateAnnotation)
    .addNode('retrieveMemory', retrieveMemory)
    .addNode('validateProfile', validateProfile)
    .addNode('intentClassifier', intentClassifier)
    .addNode('schemeRAG', schemeRAG)
    .addNode('respond', respond)
    .addNode('updateMemory', updateMemory)
    .addEdge(START, 'retrieveMemory')
    .addEdge('retrieveMemory', 'validateProfile')
    .addConditionalEdges('validateProfile', (state) => {
        return state.shouldEndAfterValidation ? 'respond' : 'intentClassifier';
    }, {
        respond: 'respond',
        intentClassifier: 'intentClassifier',
    })
    .addConditionalEdges('intentClassifier', (state) => {
        return state.requiresSchemeRag ? 'schemeRAG' : 'respond';
    }, {
        schemeRAG: 'schemeRAG',
        respond: 'respond',
    })
    .addEdge('schemeRAG', 'respond')
    .addEdge('respond', 'updateMemory')
    .addEdge('updateMemory', END);

const whatsappAgentGraph = graphBuilder.compile();

export async function runWhatsappAgent(input: AgentInput): Promise<string> {
    const result = await whatsappAgentGraph.invoke({
        phoneNumber: input.phoneNumber,
        userMessage: input.message,
        namespace: '',
        memoryContext: '',
        profile: {},
        missingField: null,
        intent: 'unknown',
        requiresSchemeRag: false,
        ragContext: '',
        finalResponse: '',
        shouldEndAfterValidation: false,
    });

    return (result.finalResponse || 'I am unable to respond right now. Please try again.').trim();
}
