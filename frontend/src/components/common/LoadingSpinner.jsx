import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 32 }) {
  return (
    <div className="spinner-container">
      <Loader2 size={size} className="animate-spin text-orange" />
      {message && <p className="spinner-text">{message}</p>}
    </div>
  );
}
