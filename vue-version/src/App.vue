<script setup lang="ts">
import { ref } from 'vue';
import ActivityHeatmap from './components/ActivityHeatmap.vue';
import type { HeatmapData, ActivityLevel, CellSelection } from './canvas';

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
      // Generate random count with some patterns
      let baseCount = Math.random() * 10000;
      
      // Higher activity during work hours (9-18)
      if (hour >= 9 && hour <= 18) {
        baseCount *= 1.5;
      }
      
      // Lower activity during night (0-6)
      if (hour >= 0 && hour <= 6) {
        baseCount *= 0.3;
      }
      
      // Weekend pattern
      if (day >= 5) {
        baseCount *= 0.7;
      }

      const count = Math.round(baseCount);
      row.push({ day, hour, count });
      rowTotal += count;
      colTotals[hour] += count;
      grandTotal += count;
      maxCount = Math.max(maxCount, count);
    }

    cells.push(row);
    rowTotals.push(rowTotal);
  }

  return {
    cells,
    rowTotals,
    colTotals,
    grandTotal,
    maxCount
  };
}

const data = ref<HeatmapData>(generateSampleData());

const activityLevels = ref<ActivityLevel[]>([
  { name: '低活跃', color: '#b7eb8f', minPercentile: 0, maxPercentile: 25, minValue: 0, maxValue: 2000, min: 0, max: 2000 },
  { name: '中等活跃', color: '#fff566', minPercentile: 25, maxPercentile: 50, minValue: 2001, maxValue: 8000, min: 2001, max: 8000 },
  { name: '高活跃', color: '#ffbb96', minPercentile: 50, maxPercentile: 75, minValue: 8001, maxValue: 14000, min: 8001, max: 14000 },
  { name: '极度活跃', color: '#ff7875', minPercentile: 75, maxPercentile: 100, minValue: 14001, maxValue: 20000, min: 14001, max: 20000 }
]);

const selectedCells = ref<CellSelection[]>([]);
const showFilter = ref(true);

function handleCellSelect(event: { cell: CellSelection; isDragging: boolean; ctrlKey: boolean; selectedCells: CellSelection[] }) {
  console.log('Cell selected:', event);
  selectedCells.value = event.selectedCells;
}

function handleActivityLevelsChange(event: { levels: ActivityLevel[] }) {
  console.log('Activity levels changed:', event.levels);
  activityLevels.value = event.levels;
}

function regenerateData() {
  data.value = generateSampleData();
  // Update activity levels max values based on new max count
  const maxCount = data.value.maxCount;
  activityLevels.value = [
    { name: '低活跃', color: '#b7eb8f', minPercentile: 0, maxPercentile: 25, minValue: 0, maxValue: Math.round(maxCount * 0.25), min: 0, max: Math.round(maxCount * 0.25) },
    { name: '中等活跃', color: '#fff566', minPercentile: 25, maxPercentile: 50, minValue: Math.round(maxCount * 0.25) + 1, maxValue: Math.round(maxCount * 0.5), min: Math.round(maxCount * 0.25) + 1, max: Math.round(maxCount * 0.5) },
    { name: '高活跃', color: '#ffbb96', minPercentile: 50, maxPercentile: 75, minValue: Math.round(maxCount * 0.5) + 1, maxValue: Math.round(maxCount * 0.75), min: Math.round(maxCount * 0.5) + 1, max: Math.round(maxCount * 0.75) },
    { name: '极度活跃', color: '#ff7875', minPercentile: 75, maxPercentile: 100, minValue: Math.round(maxCount * 0.75) + 1, maxValue: maxCount, min: Math.round(maxCount * 0.75) + 1, max: maxCount }
  ];
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-2">Activity Heatmap</h1>
      <p class="text-gray-600 mb-8">Vue 3 + UnoCSS + Canvas 实现的热力图组件</p>
      
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-700">热力图演示</h2>
          <div class="flex gap-3">
            <button 
              @click="regenerateData"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              重新生成数据
            </button>
            <button 
              @click="selectedCells = []"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              清除选择
            </button>
          </div>
        </div>
        
        <ActivityHeatmap
          :data="data"
          :activity-levels="activityLevels"
          :selected-cells="selectedCells"
          :show-filter="showFilter"
          @cellselect="handleCellSelect"
          @activitylevelschange="handleActivityLevelsChange"
        />
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">使用说明</h2>
        <ul class="list-disc list-inside space-y-2 text-gray-600">
          <li>单击单元格：选中/取消选中该单元格</li>
          <li>单击行/列总计：选中整行/整列</li>
          <li>Ctrl + 单击：多选模式</li>
          <li>点击图例旁的 ⚙ 图标：打开活动水平设置</li>
        </ul>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">选中状态</h2>
        <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(selectedCells, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
