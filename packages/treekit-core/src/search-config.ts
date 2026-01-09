/**
 * 搜索配置
 */
export interface SearchConfig {
  /** 是否启用搜索结果跳转导航（关闭时不初始化导航相关逻辑） */
  enableNavigation: boolean;
  /** 上一个/下一个是否支持循环（关闭时到边界返回 false） */
  enableLoop: boolean;
  /** 是否提供计数（current/total） */
  showCount: boolean;
  /** 搜索防抖时间（ms） */
  debounceMs: number;
}

/**
 * 默认配置
 */
export const defaultSearchConfig: SearchConfig = {
  enableNavigation: true,
  enableLoop: true,
  showCount: true,
  debounceMs: 200
};

/**
 * 创建搜索配置（合并默认值）
 */
export function createSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig {
  return { ...defaultSearchConfig, ...overrides };
}
