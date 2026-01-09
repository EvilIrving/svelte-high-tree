// Types
export type {
  RawNode,
  FlatNode,
  TreeIndex,
  TreeOptions,
  NodeStatus,
  FieldMapper,
  CheckState
} from './types';
export { defaultTreeOptions } from './types';

// Core
export { TreeEngine } from './TreeEngine';

// Algorithms
export {
  buildFlatTree,
  getAncestorIds,
  getSubtreeIds
} from './algorithms/flatten';

export {
  computeVisibleNodes,
  computeFilteredVisibleNodes,
  toggleExpand,
  expandToNode,
  expandMultiple,
  collapseSiblings
} from './algorithms/visibility';

export {
  toggleCheck,
  getCheckState,
  checkAll,
  uncheckAll,
  getCheckedLeafIds
} from './algorithms/checkbox';

// Virtual List
export {
  VirtualListController,
  calculateVisibleRange,
  type VirtualListState,
  getNodeCheckState
} from './virtual-list';

// Search
export { SearchController, searchSync, type SearchResult } from './search';
export { defaultSearchConfig, createSearchConfig, type SearchConfig } from './search-config';
