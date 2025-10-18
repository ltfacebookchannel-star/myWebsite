
import React from 'react';

interface AdPlaceholderProps {
  height?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ height = 'h-48' }) => {
  return (
    <div className={`bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-500 ${height}`}>
      <div className="text-center">
        <p className="font-semibold">Advertisement</p>
        <p className="text-sm">300 x 250</p>
      </div>
    </div>
  );
};

export default AdPlaceholder;
