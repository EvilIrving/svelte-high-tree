// Types
export type { FileEvent, SourceNode, DisplayNode, FlatDisplayNode, DisplayTreeIndex } from './types';

// Source Store
export { SourceTreeStore } from './source-store';

// Compress
export { buildDisplayTree, buildCompressedChain, findDisplayIdBySourceId } from './compress';

// Flatten
export { flattenDisplayNodes, computeVisibleDisplayNodes } from './flatten-display';

// Manager
export { CompressedTreeManager, createCompressedTreeManager } from './compressed-manager.svelte';
