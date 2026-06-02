import { useEffect, useRef } from 'react';
import echarts from '../lib/echarts';

export function EChart({
  option,
  height = 400,
  className,
}: {
  option: any;
  height?: number | string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
    />
  );
}
