<script lang="ts">
  import { onMount } from 'svelte';
  import { createCompressedTreeManager, type FileEvent } from '$lib/file-tree';
  import FileTree from '$lib/components/FileTree.svelte';

  const manager = createCompressedTreeManager();

  // 模拟 AI 生成文件的事件流
  const mockEvents: FileEvent[] = [
    // 第一个文件：深层嵌套路径（会被压缩）
    {
      type: 'file',
      name: 'report.md',
      id: 'file-1',
      parent: [
        { type: 'folder', name: 'output', id: 'folder-output' },
        { type: 'folder', name: 'reports', id: 'folder-reports' },
        { type: 'folder', name: '2024', id: 'folder-2024' }
      ]
    },
    // 第二个文件：同目录下新增（触发拆解）
    {
      type: 'file',
      name: 'summary.xlsx',
      id: 'file-2',
      parent: [
        { type: 'folder', name: 'output', id: 'folder-output' },
        { type: 'folder', name: 'reports', id: 'folder-reports' },
        { type: 'folder', name: '2024', id: 'folder-2024' }
      ]
    },
    // 第三个文件：另一个分支
    {
      type: 'file',
      name: 'data.json',
      id: 'file-3',
      parent: [
        { type: 'folder', name: 'output', id: 'folder-output' },
        { type: 'folder', name: 'data', id: 'folder-data' }
      ]
    },
    // 第四个文件：单独的深层路径（会被压缩）
    {
      type: 'file',
      name: 'analysis.md',
      id: 'file-4',
      parent: [
        { type: 'folder', name: 'output', id: 'folder-output' },
        { type: 'folder', name: 'analysis', id: 'folder-analysis' },
        { type: 'folder', name: 'weekly', id: 'folder-weekly' },
        { type: 'folder', name: 'december', id: 'folder-december' }
      ]
    }
  ];

  let currentEventIndex = $state(0);
  let eventLog = $state<string[]>([]);

  // 添加下一个文件事件
  function addNextFile() {
    if (currentEventIndex >= mockEvents.length) return;

    const event = mockEvents[currentEventIndex];
    manager.addFile(event);

    // 记录日志
    const parentPath = event.parent.map((p) => p.name).join('/');
    eventLog = [...eventLog, `添加: ${parentPath}/${event.name}`];

    currentEventIndex++;
  }

  // 批量添加所有文件
  function addAllFiles() {
    const remaining = mockEvents.slice(currentEventIndex);
    manager.addFiles(remaining);

    for (const event of remaining) {
      const parentPath = event.parent.map((p) => p.name).join('/');
      eventLog = [...eventLog, `添加: ${parentPath}/${event.name}`];
    }

    currentEventIndex = mockEvents.length;
  }

  // 重置
  function reset() {
    manager.clear();
    currentEventIndex = 0;
    eventLog = [];
  }

  // 初始展开全部
  $effect(() => {
    if (manager.flatNodes.length > 0) {
      manager.expandAll();
    }
  });
</script>

<div class="demo-container">
  <div class="demo-header">
    <h1>增量路径压缩文件树 Demo</h1>
    <p>演示 AI 生成文件时的增量更新和路径压缩</p>
  </div>

  <div class="demo-content">
    <!-- 左侧：控制面板 -->
    <div class="control-panel">
      <div class="controls">
        <button onclick={addNextFile} disabled={currentEventIndex >= mockEvents.length}>
          添加下一个文件 ({currentEventIndex}/{mockEvents.length})
        </button>
        <button onclick={addAllFiles} disabled={currentEventIndex >= mockEvents.length}>
          添加所有文件
        </button>
        <button onclick={reset}>重置</button>
      </div>

      <div class="stats">
        <div>总节点: {manager.totalNodeCount}</div>
        <div>可见节点: {manager.visibleNodeCount}</div>
        <div>
          已选: {manager.selectedId
            ? manager.getNode(manager.selectedId)?.name ?? '无'
            : '无'}
        </div>
      </div>

      <div class="event-log">
        <h3>事件日志</h3>
        <div class="log-list">
          {#each eventLog as log, i}
            <div class="log-item">{i + 1}. {log}</div>
          {/each}
          {#if eventLog.length === 0}
            <div class="log-empty">暂无事件</div>
          {/if}
        </div>
      </div>

      <div class="hint">
        <h3>路径压缩规则</h3>
        <ul>
          <li>单子目录链会被压缩为 A/B/C 形式</li>
          <li>新增文件可能触发拆解</li>
          <li>源数据结构始终保持不变</li>
        </ul>
      </div>
    </div>

    <!-- 右侧：文件树 -->
    <div class="tree-panel">
      <div class="tree-toolbar">
        <button onclick={() => manager.expandAll()}>全部展开</button>
        <button onclick={() => manager.collapseAll()}>全部收起</button>
      </div>
      <div class="tree-wrapper">
        <FileTree
          visibleList={manager.visibleList}
          flatNodes={manager.flatNodes}
          expandedSet={manager.expandedSet}
          selectedId={manager.selectedId}
          index={manager.index}
          itemHeight={32}
          onToggleExpand={(id) => manager.toggleExpand(id)}
          onSelect={(id) => manager.selectNode(id)}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .demo-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .demo-header h1 {
    margin: 0 0 8px;
    font-size: 24px;
    color: #333;
  }

  .demo-header p {
    margin: 0;
    color: #666;
  }

  .demo-content {
    display: flex;
    gap: 24px;
  }

  .control-panel {
    width: 320px;
    flex-shrink: 0;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .controls button {
    padding: 10px 16px;
    font-size: 14px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .controls button:hover:not(:disabled) {
    border-color: #1890ff;
    color: #1890ff;
  }

  .controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stats {
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    color: #666;
  }

  .stats div {
    margin-bottom: 4px;
  }

  .event-log {
    margin-bottom: 16px;
  }

  .event-log h3 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #333;
  }

  .log-list {
    max-height: 200px;
    overflow-y: auto;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 8px;
  }

  .log-item {
    font-size: 12px;
    color: #666;
    padding: 4px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .log-item:last-child {
    border-bottom: none;
  }

  .log-empty {
    font-size: 12px;
    color: #999;
    text-align: center;
    padding: 16px;
  }

  .hint {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 6px;
    padding: 12px;
  }

  .hint h3 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #1890ff;
  }

  .hint ul {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    color: #666;
  }

  .hint li {
    margin-bottom: 4px;
  }

  .tree-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
  }

  .tree-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #fafafa;
    border-bottom: 1px solid #d9d9d9;
  }

  .tree-toolbar button {
    padding: 4px 12px;
    font-size: 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
  }

  .tree-toolbar button:hover {
    border-color: #1890ff;
    color: #1890ff;
  }

  .tree-wrapper {
    flex: 1;
    height: 500px;
  }
</style>
