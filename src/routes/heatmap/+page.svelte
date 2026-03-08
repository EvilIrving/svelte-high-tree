<script lang="ts">
  import ActivityHeatmap, {
    type HeatmapData,
    type ActivityLevel,
    type CellSelection
  } from '$lib/components/ActivityHeatmap.svelte';

  // Generate sample data
  function generateSampleData(): HeatmapData {
    const cells: { day: number; hour: number; count: number }[][] = [];
    const rowTotals: number[] = [];
    const colTotals: number[] = new Array(24).fill(0);
    let grandTotal = 0;
    let maxCount = 0;

    for (let day = 0; day < 7; day++) {
      const row: { day: number; hour: number; count: number }[] = [];
      let rowTotal = 0;

      for (let hour = 0; hour < 24; hour++) {
        let baseCount: number;

        if (hour >= 9 && hour <= 18) {
          baseCount = 8000 + Math.random() * 7000;
        } else if (hour >= 19 && hour <= 22) {
          baseCount = 6000 + Math.random() * 5000;
        } else if (hour >= 7 && hour <= 8) {
          baseCount = 4000 + Math.random() * 4000;
        } else {
          baseCount = 1000 + Math.random() * 2000;
        }

        if (day >= 5) {
          baseCount *= 0.6;
        }

        const count = Math.round(baseCount);
        row.push({ day, hour, count });
        rowTotal += count;
        colTotals[hour] += count;
        maxCount = Math.max(maxCount, count);
      }

      cells.push(row);
      rowTotals.push(rowTotal);
      grandTotal += rowTotal;
    }

    // Add some variation
    cells[2][15].count = 15000;
    cells[2][16].count = 14000;
    cells[3][16].count = 13000;
    cells[4][17].count = 13000;
    cells[5][14].count = 14000;
    cells[1][20].count = 14000;

    // Recalculate totals
    for (let hour = 0; hour < 24; hour++) {
      colTotals[hour] = cells.reduce((sum, row) => sum + row[hour].count, 0);
    }
    for (let day = 0; day < 7; day++) {
      rowTotals[day] = cells[day].reduce((sum, cell) => sum + cell.count, 0);
    }
    grandTotal = rowTotals.reduce((sum, total) => sum + total, 0);
    maxCount = Math.max(maxCount, ...colTotals, ...rowTotals);

    return { cells, rowTotals, colTotals, grandTotal, maxCount };
  }

  let heatmapData = $state(generateSampleData());
  let selectedCells = $state<CellSelection[]>([]);
  let activityLevels = $state<ActivityLevel[]>([
    { name: '低活跃', color: '#b7eb8f', minPercentile: 0, maxPercentile: 0.2, minValue: 0, maxValue: 0, min: 0, max: 4000 },
    { name: '中等活跃', color: '#fff566', minPercentile: 0.2, maxPercentile: 0.6, minValue: 0, maxValue: 0, min: 4001, max: 12000 },
    { name: '高活跃', color: '#ffbb96', minPercentile: 0.6, maxPercentile: 0.9, minValue: 0, maxValue: 0, min: 12001, max: 18000 },
    { name: '极度活跃', color: '#ff7875', minPercentile: 0.9, maxPercentile: 1.0, minValue: 0, maxValue: 0, min: 18001, max: 20000 }
  ]);
  let applyFilter = $state(false);
  let filteredData = $state<{ day: number; hour: number; count: number; matched: boolean }[] | null>(null);

  // 日期时间区间筛选
  let dateRangeStart = $state(0); // 开始的星期 (0-6)
  let dateRangeEnd = $state(6);   // 结束的星期 (0-6)
  let hourRangeStart = $state(0); // 开始的小时 (0-23)
  let hourRangeEnd = $state(23);  // 结束的小时 (0-23)
  let enableDateRangeFilter = $state(false);

  // Refresh data
  function refreshData() {
    heatmapData = generateSampleData();
    selectedCells = [];
    filteredData = null;
    applyFilter = false;
    enableDateRangeFilter = false;
    dateRangeStart = 0;
    dateRangeEnd = 6;
    hourRangeStart = 0;
    hourRangeEnd = 23;
  }

  // 应用日期时间区间筛选
  function applyDateRangeFilter() {
    if (!enableDateRangeFilter) {
      // 禁用筛选时显示全部数据
      heatmapData = generateSampleData();
      return;
    }

    const originalData = generateSampleData();
    const filteredCells: typeof originalData.cells = [];
    const filteredRowTotals: number[] = [];
    const filteredColTotals: number[] = new Array(24).fill(0);

    for (let day = dateRangeStart; day <= dateRangeEnd; day++) {
      const row: typeof originalData.cells[0] = [];
      let rowTotal = 0;
      for (let hour = hourRangeStart; hour <= hourRangeEnd; hour++) {
        const cell = originalData.cells[day]?.[hour];
        const count = cell?.count ?? 0;
        row.push({ count });
        rowTotal += count;
        filteredColTotals[hour] += count;
      }
      filteredCells.push(row);
      filteredRowTotals.push(rowTotal);
    }

    const grandTotal = filteredRowTotals.reduce((a, b) => a + b, 0);

    heatmapData = {
      ...originalData,
      cells: filteredCells,
      rowTotals: filteredRowTotals,
      colTotals: filteredColTotals,
      grandTotal
    };

    // 清空选中状态
    selectedCells = [];
    filteredData = null;
    applyFilter = false;
  }

  // Handle cell selection
  function handleCellSelect(event: CustomEvent) {
    const { selectedCells: newSelected } = event.detail;
    selectedCells = newSelected;
  }

  // Handle activity levels change
  function handleActivityLevelsChange(event: CustomEvent) {
    activityLevels = event.detail.levels;
  }

  // Apply filter logic
  function applyFilterLogic() {
    if (!applyFilter || selectedCells.length === 0) {
      filteredData = null;
      return;
    }

    // Build selection lookup
    const selectedSet = new Set<string>();
    const selectedRows = new Set<number>();
    const selectedCols = new Set<number>();

    selectedCells.forEach((cell) => {
      if (cell.type === 'cell') {
        selectedSet.add(`${cell.day}-${cell.hour}`);
      } else if (cell.type === 'row') {
        selectedRows.add(cell.day);
      } else if (cell.type === 'col') {
        selectedCols.add(cell.hour);
      }
    });

    // Filter data
    const result: { day: number; hour: number; count: number; matched: boolean }[] = [];
    heatmapData.cells.forEach((row, day) => {
      row.forEach((cell, hour) => {
        const isMatched = selectedSet.has(`${day}-${hour}`) ||
                         selectedRows.has(day) ||
                         selectedCols.has(hour);
        result.push({ ...cell, matched: isMatched });
      });
    });

    filteredData = result;
    console.log('Filtered data:', result.filter((d) => d.matched).length, 'cells matched');
  }

  // Get filter stats
  let filterStats = $derived.by(() => {
    if (!filteredData) return null;
    const matched = filteredData.filter((d) => d.matched);
    const totalCount = matched.reduce((sum, d) => sum + d.count, 0);
    return {
      cellCount: matched.length,
      totalCount
    };
  });
</script>

<svelte:head>
  <title>Activity Heatmap - Demo</title>
</svelte:head>

<div class="heatmap-page">
  <header class="page-header">
    <h1>活跃度热力图</h1>
    <p class="subtitle">基于 Canvas 的自定义热力图组件</p>
  </header>

  <div class="controls-panel">
    <div class="control-group">
      <label>时间过滤器</label>
      <button class="btn-filter" onclick={refreshData}>
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
        </svg>
        重置
      </button>
    </div>

    <!-- 日期时间区间筛选 -->
    <div class="control-group date-range-filter">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={enableDateRangeFilter} onchange={applyDateRangeFilter} />
        日期时间区间
      </label>
      {#if enableDateRangeFilter}
        <div class="date-range-inputs">
          <select bind:value={dateRangeStart} onchange={applyDateRangeFilter}>
            {#each ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as day, i}
              <option value={i}>{day}</option>
            {/each}
          </select>
          <span>至</span>
          <select bind:value={dateRangeEnd} onchange={applyDateRangeFilter}>
            {#each ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as day, i}
              <option value={i}>{day}</option>
            {/each}
          </select>
          <span class="separator">|</span>
          <select bind:value={hourRangeStart} onchange={applyDateRangeFilter}>
            {#each Array(24) as _, i}
              <option value={i}>{i.toString().padStart(2, '0')}:00</option>
            {/each}
          </select>
          <span>至</span>
          <select bind:value={hourRangeEnd} onchange={applyDateRangeFilter}>
            {#each Array(24) as _, i}
              <option value={i}>{i.toString().padStart(2, '0')}:00</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>

    <div class="control-group">
      <label>已选单元格：</label>
      <span class="selection-count">{selectedCells.length} 个</span>
    </div>

    <div class="control-group">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={applyFilter} onchange={applyFilterLogic} />
        应用过滤器
      </label>
    </div>

    {#if filterStats}
      <div class="control-group filter-stats">
        <span>匹配：{filterStats.cellCount} 单元格</span>
        <span>总计：{filterStats.totalCount.toLocaleString()} 事件</span>
      </div>
    {/if}
  </div>

  <div class="heatmap-wrapper">
    <ActivityHeatmap
      data={heatmapData}
      activityLevels={activityLevels}
      selectedCells={selectedCells}
      showFilter={true}
      oncellselect={handleCellSelect}
      onactivitylevelschange={handleActivityLevelsChange}
    />
  </div>

  {#if filteredData}
    <div class="filter-results">
      <h3>过滤结果</h3>
      <div class="results-grid">
        {#each filteredData.filter((d) => d.matched) as cell}
          <div class="result-cell">
            <span class="result-day">周{['一', '二', '三', '四', '五', '六', '日'][cell.day]}</span>
            <span class="result-hour">{cell.hour}:00</span>
            <span class="result-count">{cell.count.toLocaleString()}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="info-panel">
    <h3>功能说明</h3>
    <ul>
      <li><strong>单击单元格</strong>：选中/取消选中单元格</li>
      <li><strong>双击单元格</strong>：打开活动水平设置</li>
      <li><strong>拖拽选择</strong>：按住鼠标拖拽可选择多个单元格</li>
      <li><strong>点击总计（行）</strong>：选中整行（右侧总计）</li>
      <li><strong>点击总计（列）</strong>：选中整列（底部总计）</li>
      <li><strong>Ctrl + 点击</strong>：多选/取消选择</li>
      <li><strong>活动水平设置</strong>：拖动滑块调整各活动级别的阈值范围</li>
      <li><strong>应用过滤器</strong>：根据选中的单元格过滤数据</li>
    </ul>
  </div>
</div>

<style>
  .heatmap-page {
    min-height: 100vh;
    background: #f5f5f5;
    padding: 24px;
  }

  .page-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .page-header h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    color: #333;
  }

  .subtitle {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .controls-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .control-group label {
    font-weight: 500;
    color: #333;
  }

  .btn-filter {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .btn-filter:hover {
    background: #40a9ff;
  }

  .selection-count {
    font-size: 14px;
    color: #1890ff;
    font-weight: 500;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .date-range-filter {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .date-range-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .date-range-inputs select {
    padding: 4px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
    background: #fff;
    cursor: pointer;
  }

  .date-range-inputs select:hover {
    border-color: #40a9ff;
  }

  .date-range-inputs .separator {
    color: #d9d9d9;
  }

  .date-range-inputs span {
    font-size: 13px;
    color: #666;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .filter-stats {
    padding: 4px 12px;
    background: #e6f7ff;
    border-radius: 4px;
    font-size: 13px;
    color: #1890ff;
    gap: 12px;
  }

  .heatmap-wrapper {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-results {
    margin-top: 16px;
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-results h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #333;
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .result-cell {
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 12px;
  }

  .result-day {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }

  .result-hour {
    color: #666;
  }

  .result-count {
    font-weight: 600;
    color: #1890ff;
    margin-top: 4px;
  }

  .info-panel {
    margin-top: 24px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .info-panel h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #333;
  }

  .info-panel ul {
    margin: 0;
    padding-left: 20px;
  }

  .info-panel li {
    margin-bottom: 8px;
    color: #666;
    font-size: 14px;
  }

  .info-panel li strong {
    color: #333;
  }
</style>
