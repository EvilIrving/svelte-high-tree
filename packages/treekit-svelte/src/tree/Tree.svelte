<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { TreeNode, RawNode, FieldMapper } from '@light-cat/treekit-core';
	import { expandMultiple } from '@light-cat/treekit-core';
	import { createTree } from './createTree.svelte';
	import VirtualTree from '../virtual/VirtualTree.svelte';
	import { SearchController } from '@light-cat/treekit-core';
	import { SearchNavigator } from '../search/search-navigator.svelte';
	import { createSearchConfig } from '@light-cat/treekit-core';

	// ============ Props 定义 ============
	interface Props {
		/** 树形数据（平铺数组或嵌套结构） */
		treeData: RawNode[];
		/** 字段映射配置（适配不同数据格式） */
		fieldMapper?: FieldMapper;
		/** 是否显示复选框 */
		checkable?: boolean;
		/** 父子勾选不联动模式 */
		checkStrictly?: boolean;
		/** 默认勾选的节点 key 列表 */
		defaultCheckedKeys?: string[];
		/** 默认展开的节点 key 列表 */
		defaultExpandedKeys?: string[];
		/** 默认选中的节点 key（单选） */
		defaultSelectedKeys?: string[];
		/** 是否可选中（点击节点选中） */
		selectable?: boolean;
		/** 是否启用搜索功能 */
		searchable?: boolean;
		/** 行高 */
		itemHeight?: number;
		/** 额外 class */
		class?: string;
		/** 勾选回调 */
		onCheck?: (checkedKeys: string[], info: { node: TreeNode; checked: boolean }) => void;
		/** 选中回调 */
		onSelect?: (selectedKeys: string[], info: { node: TreeNode; selected: boolean }) => void;
		/** 展开/收起回调 */
		onExpand?: (expandedKeys: string[], info: { node: TreeNode; expanded: boolean }) => void;
	}

	let {
		treeData,
		fieldMapper,
		checkable = false,
		checkStrictly = false,
		defaultCheckedKeys = [],
		defaultExpandedKeys = [],
		defaultSelectedKeys = [],
		selectable = true,
		searchable = false,
		itemHeight = 32,
		class: className = '',
		onCheck,
		onSelect,
		onExpand
	}: Props = $props();

	// ============ 内部状态管理 ============
	const tree = createTree(treeData, {
		checkable,
		checkStrictly,
		defaultCheckedKeys,
		defaultExpandedKeys,
		defaultSelectedKeys,
		fieldMapper
	});

	// VirtualTree 引用
	let virtualTreeRef: VirtualTree;

	// ============ 搜索功能 ============
	const searchConfig = createSearchConfig({
		enableNavigation: true,
		enableLoop: true,
		showCount: true
	});

	let searchController: SearchController | null = null;
	const searchNavigator = new SearchNavigator(searchConfig);
	let currentSearchKeyword = '';

	// 在客户端初始化搜索（Web Worker 只存在于浏览器环境）
	onMount(() => {
		if (searchable) {
			searchController = new SearchController({
				debounceMs: searchConfig.debounceMs,
				onResult: (result) => {
					// 使用 Worker 返回的匹配结果，而不是重新同步过滤
					tree.setMatchResult(result.matchIds, result.expandIds);
					const navResult = searchNavigator.updateMatches(result.matchIds);
					if (navResult.id) {
						requestAnimationFrame(() => {
							virtualTreeRef?.scrollToNode(navResult.id!);
						});
					}
				}
			});
			searchController.init(treeData);
			searchNavigator.init(tree.flatNodes, tree.index);
		}
	});

	// ============ 事件处理 ============
	function handleToggleExpand(nodeId: string) {
		const node = tree.index.nodeMap.get(nodeId);
		if (!node) return;

		const wasExpanded = tree.expandedSet.has(nodeId);
		const visibleIndex = tree.getVisibleIndex(nodeId);
		if (visibleIndex >= 0) {
			tree.toggle(visibleIndex);
		}

		// 触发回调
		onExpand?.(Array.from(tree.expandedSet), {
			node,
			expanded: !wasExpanded
		});
	}

	function handleToggleCheck(nodeId: string) {
		const node = tree.index.nodeMap.get(nodeId);
		if (!node) return;

		const wasChecked = tree.checkedSet.has(nodeId);
		// 直接用 nodeId 切换，避免 visibleIndex 的中间步骤
		tree.toggleCheckById(nodeId);

		// 触发回调
		onCheck?.(Array.from(tree.checkedSet), {
			node,
			checked: !wasChecked
		});
	}

	let clickTimer: ReturnType<typeof setTimeout> | null = null;

	function handleNodeClick(nodeId: string) {
		if (!selectable) return;

		const node = tree.index.nodeMap.get(nodeId);
		if (!node) return;

		if (clickTimer) {
			// 300ms 内再次点击 → 双击
			clearTimeout(clickTimer);
			clickTimer = null;

			// 双击展开（不影响选中状态）
			if (node.hasChildren) {
				const visibleIndex = tree.getVisibleIndex(nodeId);
				if (visibleIndex >= 0) {
					const wasExpanded = tree.expandedSet.has(nodeId);
					tree.toggle(visibleIndex);

					// 触发回调
					onExpand?.(Array.from(tree.expandedSet), {
						node,
						expanded: !wasExpanded
					});
				}
			}
		} else {
			// 首次点击 → 延迟后选中
			clickTimer = setTimeout(() => {
				clickTimer = null;

				const wasSelected = tree.selectedId === nodeId;
				if (wasSelected) {
					tree.clearSelection();
				} else {
					tree.select(nodeId);
				}

				// 触发回调
				onSelect?.(tree.selectedId ? [tree.selectedId] : [], {
					node,
					selected: !wasSelected
				});
			}, 300);
		}
	}

	// ============ 公开方法 ============
	/** 展开所有节点 */
	export function expandAll() {
		tree.expandAll();
	}

	/** 收起所有节点 */
	export function collapseAll() {
		tree.collapseAll();
	}

	/** 展开到指定深度 */
	export function expandToDepth(depth: number) {
		tree.expandToDepth(depth);
	}

	/** 全选 */
	export function checkAll() {
		tree.checkAll();
		// 触发 onCheck 回调
		const checkedKeys = Array.from(tree.checkedSet);
		const node = tree.flatNodes[0] || null;
		onCheck?.(checkedKeys, { node: node!, checked: true });
	}

	/** 取消全选 */
	export function uncheckAll() {
		tree.uncheckAll();
		// 触发 onCheck 回调
		const checkedKeys = Array.from(tree.checkedSet);
		const node = tree.flatNodes[0] || null;
		onCheck?.(checkedKeys, { node: node!, checked: false });
	}

	/** 滚动到指定节点 */
	export function scrollToNode(nodeId: string) {
		virtualTreeRef?.scrollToNode(nodeId);
	}

	/** 获取已勾选的叶子节点 ID */
	export function getCheckedLeafKeys(): string[] {
		return tree.getCheckedLeafIDs();
	}

	/** 获取所有已勾选的节点 ID */
	export function getCheckedKeys(): string[] {
		return Array.from(tree.checkedSet);
	}

	/** 获取当前选中的节点 ID */
	export function getSelectedKey(): string | null {
		return tree.selectedId;
	}

	// ============ 搜索相关方法 ============
	/** 执行搜索 */
	export function search(keyword: string) {
		if (!searchable || !searchController) return;
		currentSearchKeyword = keyword;
		if (keyword.trim() === '') {
			tree.clearFilter();
			searchNavigator.reset();
		} else {
			searchController.search(keyword);
		}
	}

	/** 清除搜索 */
	export function clearSearch() {
		if (!searchable) return;
		currentSearchKeyword = '';
		tree.clearFilter();
		searchController?.clear();
		searchNavigator.reset();
	}

	/** 跳转到下一个匹配项 */
	export function nextMatch() {
		if (!searchable) return;
		const result = searchNavigator.next();
		if (result.id) {
			tree.setExpandedSet(expandMultiple(new Set(result.expandIds), new Set(tree.expandedSet)));
			requestAnimationFrame(() => {
				virtualTreeRef?.scrollToNode(result.id!);
			});
		}
	}

	/** 跳转到上一个匹配项 */
	export function prevMatch() {
		if (!searchable) return;
		const result = searchNavigator.prev();
		if (result.id) {
			tree.setExpandedSet(expandMultiple(new Set(result.expandIds), new Set(tree.expandedSet)));
			requestAnimationFrame(() => {
				virtualTreeRef?.scrollToNode(result.id!);
			});
		}
	}

	/** 获取搜索状态 */
	export function getSearchState() {
		return {
			hasMatches: searchNavigator.hasMatches,
			current: searchNavigator.current ?? 0,
			total: searchNavigator.total ?? 0,
			currentId: searchNavigator.currentId
		};
	}

	/** 获取树状态统计 */
	export function getStats() {
		return {
			totalCount: tree.totalCount,
			visibleCount: tree.visibleCount,
			checkedCount: tree.checkedCount,
			expandedCount: tree.expandedSet.size
		};
	}

	// 清理
	onDestroy(() => {
		searchController?.destroy();
		tree.destroy();
	});
</script>

<div class="treekit-tree {className}">
	<VirtualTree
		bind:this={virtualTreeRef}
		visibleList={tree.visibleList}
		flatNodes={tree.flatNodes}
		expandedSet={tree.expandedSet}
		checkedSet={tree.checkedSet}
		matchSet={tree.matchSet}
		showCheckbox={checkable}
		{checkStrictly}
		currentMatchId={searchNavigator.currentId}
		selectedId={tree.selectedId}
		index={tree.index}
		{itemHeight}
		onToggleExpand={handleToggleExpand}
		onToggleCheck={handleToggleCheck}
		onNodeClick={handleNodeClick}
	/>
</div>

<style>
	.treekit-tree {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
