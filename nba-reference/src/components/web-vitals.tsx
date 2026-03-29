'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { logInfo, logWarn } from '@/lib/logger';

interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function WebVitalsReporter(): null {
  useReportWebVitals((metric: WebVitalMetric) => {
    const id: string = metric.id;
    const name: string = metric.name;
    const value: number = metric.value;
    const rating: string = metric.rating;
    const context = {
      metric: name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      id,
    };

    if (rating === 'good') {
      logInfo(`Web Vital: ${name}`, context);
    } else {
      logWarn(`Web Vital: ${name} (${rating})`, context);
    }
  });

  return null;
}
