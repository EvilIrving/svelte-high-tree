<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  CanvasEngine,
  HeatmapRenderer,
  HeatmapEventHandler,
  type HeatmapData,
  type ActivityLevel,
  type CellSelection
} from '../canvas';

// ========== Props ==========
interface Props {
  data: HeatmapData;
  activityLevels?: ActivityLevel[];
  selectedCells?: CellSelection[];
  showFilter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  activityLevels: () => [],
  selectedCells: () => [],
  showFilter: false
});

// ========== Emits ==========
const emit = defineEmits<{
  cellselect: [event: { cell: CellSelection; isDragging: boolean; ctrlKey: boolean; selectedCells: CellSelection[] }];
  activitylevelschange: [event: { levels: ActivityLevel[] }];
}>();

// ========== State ==========
const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const settingsOpen = ref(false);
const ctrlKey = ref(false);
const localActivityLevels = ref<ActivityLevel[]>(props.activityLevels.length > 0 ? [...props.activityLevels] : []);

// Canvas 引擎实例（只在客户端创建）
let engine: CanvasEngine | null = null;
let renderer: HeatmapRenderer | null = null;
let eventHandler: HeatmapEventHandler | null = null;

// 布局常量
const CELL_WIDTH = 40;
const CELL_HEIGHT = 26;
const ROW_LABEL_WIDTH = 40;
const COL_LABEL_HEIGHT = 20;
const LEGEND_WIDTH = 320;
const PADDING = 20;
const GAP = 2;

// 计算画布尺寸
const canvasWidth = computed(() => {
  return ROW_LABEL_WIDTH + (props.data.cells[0]?.length ?? 0) * (CELL_WIDTH + GAP) + PADDING * 2 + LEGEND_WIDTH;
});

const canvasHeight = computed(() => {
  return COL_LABEL_HEIGHT + props.data.cells.length * (CELL_HEIGHT + GAP) + PADDING * 2 + 40;
});

// ========== Lifecycle ==========
onMounted(() => {
  if (!canvasRef.value) return;

  // 创建引擎
  engine = new CanvasEngine(canvasRef.value, {
    width: canvasWidth.value,
    height: canvasHeight.value
  });

  // 创建渲染器
  renderer = new HeatmapRenderer({
    data: props.data,
    activityLevels: localActivityLevels.value,
    selectedCells: props.selectedCells,
    showFilter: props.showFilter
  });

  // 创建事件处理器
  eventHandler = new HeatmapEventHandler({
    handlers: {
      onCellSelect: handleCellSelect,
      onSettingsOpen: () => { settingsOpen.value = true; }
    },
    getCtrlKey: () => ctrlKey.value,
    getSelectedCells: () => props.selectedCells,
    cellCount: 24,
    rowCount: 7
  });

  // 设置 renderer 引用到 eventHandler（用于检测设置图标点击）
  eventHandler.setRenderer(renderer);

  // 设置引擎
  engine.setRenderer(renderer);
  engine.setEventHandler(eventHandler);

  // 键盘事件
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);
});

onUnmounted(() => {
  engine?.destroy();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', handleBlur);
  window.removeEventListener('mousemove', handleDragMove);
  window.removeEventListener('mouseup', handleDragEnd);
});

// ========== Watchers ==========
watch(() => props.selectedCells, (newCells) => {
  if (renderer && engine) {
    renderer.updateOptions({
      data: props.data,
      activityLevels: localActivityLevels.value,
      selectedCells: newCells,
      showFilter: props.showFilter
    });
    engine.render();
  }
}, { deep: true });

watch(() => props.activityLevels, (newLevels) => {
  console.log('[ActivityHeatmap] activityLevels changed:', newLevels);
  if (newLevels.length > 0) {
    localActivityLevels.value = [...newLevels];
  }
}, { deep: true });

// ========== Event Handlers ==========
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    ctrlKey.value = true;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  if (event.key === 'Control' || event.key === 'Meta') {
    ctrlKey.value = false;
  }
}

function handleBlur() {
  // 当窗口失去焦点时，重置 ctrlKey 状态
  ctrlKey.value = false;
}

function handleCellSelect(event: {
  cell: CellSelection;
  isDragging: boolean;
  ctrlKey: boolean;
  selectedCells: CellSelection[];
}): void {
  emit('cellselect', event);
}

function handleActivityLevelsChange(): void {
  emit('activitylevelschange', { levels: localActivityLevels.value });
  settingsOpen.value = false;
}

function updateActivityLevel(index: number, value: number, isMin: boolean): void {
  const levels = [...localActivityLevels.value];
  const level = { ...levels[index] };

  if (isMin) {
    level.min = value;
    if (index > 0) {
      levels[index - 1].max = Math.max(value - 1, levels[index - 1].min);
    }
  } else {
    level.max = value;
    if (index < levels.length - 1) {
      levels[index + 1].min = Math.min(value + 1, levels[index + 1].max);
    }
  }

  levels[index] = level;
  localActivityLevels.value = levels;
}

// ========== Slider Drag Functions ==========
let draggingHandle: { index: number } | null = null;

function getPercentage(value: number): number {
  const pct = (value / props.data.maxCount) * 100;
  console.log('[ActivityHeatmap] getPercentage:', value, '/', props.data.maxCount, '=', pct);
  return pct;
}

function getValueFromPercentage(percentage: number): number {
  return Math.round((percentage / 100) * props.data.maxCount);
}

function startDrag(event: MouseEvent, index: number): void {
  draggingHandle = { index };
  event.preventDefault();
  event.stopPropagation();
}

function handleSliderKeyDown(event: KeyboardEvent): void {
  if (!draggingHandle) return;

  const { index } = draggingHandle;
  const levels = [...localActivityLevels.value];
  const step = Math.max(1, Math.round(props.data.maxCount * 0.01)); // 1% step
  let delta = 0;

  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    delta = -step;
  } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    delta = step;
  } else {
    return;
  }

  event.preventDefault();

  // Handle at index controls the max of level[index] and min of level[index+1]
  const prevMax = index > 0 ? levels[index - 1].max : 0;
  const nextMax = index < 2 ? levels[index + 1].max : props.data.maxCount;
  const currentValue = levels[index].max;
  const newValue = Math.max(prevMax + 1, Math.min(nextMax - 1, currentValue + delta));

  if (newValue !== currentValue) {
    levels[index].max = newValue;
    if (index < levels.length - 1) {
      levels[index + 1].min = newValue + 1;
    }
    localActivityLevels.value = levels;
  }
}

function handleDragMove(event: MouseEvent): void {
  if (!draggingHandle || !containerRef.value) return;

  const trackRect = containerRef.value.querySelector('.slider-track-wrapper')?.getBoundingClientRect();
  if (!trackRect) return;

  const x = event.clientX - trackRect.left;
  const percentage = Math.max(0, Math.min(100, (x / trackRect.width) * 100));
  const value = getValueFromPercentage(percentage);

  const levels = [...localActivityLevels.value];
  const { index } = draggingHandle;

  // Handle at index controls the max of level[index] and min of level[index+1]
  // Ensure handles stay in order
  const prevMax = index > 0 ? levels[index - 1].max : 0;
  const nextMax = index < 2 ? levels[index + 1].max : props.data.maxCount;

  if (value > prevMax && value < nextMax) {
    levels[index].max = value;
    if (index < levels.length - 1) {
      levels[index + 1].min = value + 1;
    }
  }

  localActivityLevels.value = levels;
}

function handleDragEnd(): void {
  draggingHandle = null;
}

// ========== Expose ==========
defineExpose({
  setSelectedCells(cells: CellSelection[]) {
    // This is handled via props
  },
  setActivityLevels(levels: ActivityLevel[]) {
    localActivityLevels.value = levels;
  }
});
</script>

<template>
  <div
    ref="containerRef"
    class="heatmap-container"
    tabindex="0"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
  >
    <canvas
      ref="canvasRef"
      class="heatmap-canvas"
    />

    <!-- Settings Modal -->
    <div v-if="settingsOpen" class="settings-overlay" @click="settingsOpen = false">
      <div class="settings-modal" @click.stop>
        <div class="settings-header">
          <h3>活动水平设置</h3>
          <button class="close-btn" @click="settingsOpen = false">×</button>
        </div>

        <div class="settings-content">
          <p class="settings-description">拖动滑块来设置事件数量和活动水平之间的对应关系</p>

          <div class="multi-slider-container">
            <!-- Slider track with color segments -->
            <div class="slider-track-wrapper">
              <div class="slider-track-segments">
                <div class="segment segment-low" :style="{ left: '0%', width: `calc(${getPercentage(localActivityLevels[0]?.max ?? 0)}% - 1px)` }"></div>
                <div class="segment segment-medium" :style="{ left: `${getPercentage(localActivityLevels[0]?.max ?? 0)}%`, width: `calc(${getPercentage(localActivityLevels[1]?.max ?? 0)}% - ${getPercentage(localActivityLevels[0]?.max ?? 0)}% - 1px)` }"></div>
                <div class="segment segment-high" :style="{ left: `${getPercentage(localActivityLevels[1]?.max ?? 0)}%`, width: `calc(${getPercentage(localActivityLevels[2]?.max ?? 0)}% - ${getPercentage(localActivityLevels[1]?.max ?? 0)}% - 1px)` }"></div>
                <div class="segment segment-extreme" :style="{ left: `${getPercentage(localActivityLevels[2]?.max ?? 0)}%`, width: `calc(100% - ${getPercentage(localActivityLevels[2]?.max ?? 0)}%)` }"></div>
              </div>

              <!-- Draggable handles -->
              <div class="slider-handles" role="group" aria-label="Activity level sliders">
                <div
                  v-for="(level, index) in localActivityLevels.slice(0, 3)"
                  :key="index"
                  class="handle"
                  :class="`handle-${index}`"
                  :style="{ left: `${getPercentage(level.max)}%` }"
                  @mousedown="(e) => startDrag(e, index)"
                  @keydown="handleSliderKeyDown"
                  role="slider"
                  tabindex="0"
                  :aria-label="`Activity threshold ${index + 1}`"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-valuenow="Math.round(getPercentage(level.max))"
                >
                  <div class="handle-knob"></div>
                </div>
              </div>

              <!-- Base track line -->
              <div class="slider-track-base"></div>
            </div>

            <!-- Percentage labels above -->
            <div class="percentage-row percentage-row-top">
              <span
                v-for="(level, index) in localActivityLevels.slice(0, 3)"
                :key="index"
                class="percentage-label percentage-top"
                :style="{ left: `${getPercentage(level.max)}%` }"
              >
                {{ Math.round(getPercentage(level.max)) }}%
              </span>
            </div>

            <!-- Max value description -->
            <div class="max-value-hint">
              <span>100% = 每小时的最大事件数</span>
              <span class="max-value-number">({{ data.maxCount.toLocaleString() }})</span>
            </div>
          </div>
        </div>

        <div class="settings-actions">
          <button class="btn-cancel" @click="settingsOpen = false">取消</button>
          <button class="btn-confirm" @click="handleActivityLevelsChange">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  position: relative;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  outline: none;
}

.heatmap-canvas {
  display: block;
  touch-action: none;
  cursor: pointer;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-modal {
  background: #fff;
  border-radius: 8px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.settings-content {
  padding: 20px;
}

.settings-description {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.multi-slider-container {
  position: relative;
  padding: 10px 0 20px 0;
}

.slider-track-wrapper {
  position: relative;
  height: 40px;
  margin: 20px 40px 10px 40px;
}

.slider-track-segments {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 4px;
  overflow: hidden;
  z-index: 1;
}

.segment {
  position: absolute;
  height: 100%;
}

.segment-low {
  background: #b7eb8f;
}

.segment-medium {
  background: #fff566;
}

.segment-high {
  background: #ffbb96;
}

.segment-extreme {
  background: #ff7875;
}

.slider-track-base {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  background: #f0f0f0;
  transform: translateY(-50%);
  border-radius: 4px;
  z-index: 0;
}

.slider-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  z-index: 10;
}

.handle {
  position: absolute;
  top: 10px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  user-select: none;
}

.handle:active {
  cursor: grabbing;
}

.handle-knob {
  width: 20px;
  height: 20px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.handle:hover .handle-knob {
  transform: scale(1.15);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  border-color: #40a9ff;
}

.percentage-row {
  position: relative;
  height: 24px;
}

.percentage-row-top {
  margin-bottom: 8px;
}

.percentage-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 12px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.percentage-top {
  top: 0;
}

.percentage-sub {
  font-size: 10px;
  color: #bbb;
  white-space: nowrap;
}

.max-value-hint {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}

.max-value-number {
  color: #1890ff;
  font-weight: 500;
  margin-left: 8px;
}

.settings-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  color: #333;
}

.btn-cancel:hover {
  border-color: #999;
}

.btn-confirm {
  background: #1890ff;
  border: 1px solid #1890ff;
  color: #fff;
}

.btn-confirm:hover {
  background: #40a9ff;
}
</style>
