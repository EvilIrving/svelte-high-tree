/**
 * Tree 搜索 Web Worker
 * 在独立线程中执行模糊搜索，不阻塞主线程
 */

interface SearchData {
  id: string;
  name: string;
  parentId: string | null;
}

interface SearchMessage {
  type: 'init' | 'search';
  payload: {
    data?: SearchData[];
    keyword?: string;
  };
}

interface SearchResultMessage {
  type: 'init-done' | 'search-result';
  payload?: {
    matchIds: string[];
    expandIds: string[];
  };
}

let searchData: SearchData[] = [];
let parentMap: Map<string, string | null> = new Map();

// 可选：倒排索引加速搜索
const invertedIndex: Map<string, Set<string>> = new Map();

/**
 * 构建倒排索引
 */
function buildInvertedIndex(data: SearchData[]): void {
  invertedIndex.clear();

  for (const node of data) {
    // 分词：按空格、下划线、驼峰分割
    const tokens = tokenize(node.name);

    for (const token of tokens) {
      if (!invertedIndex.has(token)) {
        invertedIndex.set(token, new Set());
      }
      invertedIndex.get(token)!.add(node.id);
    }
  }
}

/**
 * 分词
 */
function tokenize(name: string): string[] {
  const lower = name.toLowerCase();
  const tokens: string[] = [];

  let current = '';

  for (const ch of lower) {
    if (/[a-z0-9]/.test(ch)) {
      // 英文、数字：串起来形成一个单词
      current += ch;
    } else {
      // 一旦遇到非英文数字，先把前面的英文数字 token 收尾
      if (current) {
        tokens.push(current);
        current = '';
      }

      // 中文：每个字一个 token
      if (/[\u4e00-\u9fff]/.test(ch)) {
        tokens.push(ch);
      }
      // 其他符号（-_~!@#$%^&*等）直接忽略，当分隔符用
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * 执行模糊搜索
 */
function performSearch(keyword: string): {
  matchIds: string[];
  expandIds: string[];
} {
  if (!keyword || keyword.trim() === '') {
    return { matchIds: [], expandIds: [] };
  }

  const lowerKeyword = keyword.toLowerCase().trim();
  const matchIdsSet = new Set<string>();

  // 策略 1：尝试前缀匹配倒排索引
  for (const [token, ids] of invertedIndex) {
    if (token.startsWith(lowerKeyword) || token.includes(lowerKeyword)) {
      for (const id of ids) {
        matchIdsSet.add(id);
      }
    }
  }

  // 策略 2：如果倒排索引没有匹配，回退到全量扫描
  if (matchIdsSet.size === 0) {
    for (const node of searchData) {
      if (node.name.toLowerCase().includes(lowerKeyword)) {
        matchIdsSet.add(node.id);
      }
    }
  }

  // 收集所有匹配节点的祖先（用于展开）
  const expandIdsSet = new Set<string>();
  for (const matchId of matchIdsSet) {
    let currentParentId = parentMap.get(matchId) ?? null;
    while (currentParentId !== null) {
      expandIdsSet.add(currentParentId);
      currentParentId = parentMap.get(currentParentId) ?? null;
    }
  }

  return {
    matchIds: Array.from(matchIdsSet),
    expandIds: Array.from(expandIdsSet)
  };
}

/**
 * 接收消息
 */
self.onmessage = (e: MessageEvent<SearchMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      if (payload.data) {
        searchData = payload.data;
        parentMap = new Map(payload.data.map((n) => [n.id, n.parentId]));
        buildInvertedIndex(payload.data);
      }
      self.postMessage({ type: 'init-done' } as SearchResultMessage);
      break;

    case 'search':
      if (payload.keyword !== undefined) {
        const result = performSearch(payload.keyword);
        self.postMessage({
          type: 'search-result',
          payload: result
        } as SearchResultMessage);
      }
      break;
  }
};
