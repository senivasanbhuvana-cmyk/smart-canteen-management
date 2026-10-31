import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

export default function EmptyState({
  icon: Icon = UtensilsCrossed,
  title = 'No items found',
  description = 'Try adjusting your filters or search terms.',
  actionText,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={44} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary empty-state-btn">
          {actionText}
        </button>
      )}
    </div>
  );
}
