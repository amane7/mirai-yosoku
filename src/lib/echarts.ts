// Tree-shaken ECharts: only register the chart/components we actually use.
// This keeps the production bundle small and the build fast.
import * as echarts from 'echarts/core';
import { SankeyChart, BarChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([SankeyChart, BarChart, TooltipComponent, GridComponent, CanvasRenderer]);

export default echarts;
