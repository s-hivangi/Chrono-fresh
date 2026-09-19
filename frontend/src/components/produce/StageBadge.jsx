import React from 'react';
import { stageBadgeClass } from '../../utils/helpers.js';

export default function StageBadge({ stage }) {
  if (!stage) return <span className="badge badge-pending">Pending</span>;
  return <span className={stageBadgeClass(stage)}>{stage}</span>;
}
