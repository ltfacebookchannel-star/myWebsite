
import React from 'react';

interface ToolCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-2xl">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-light text-primary">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-dark">{title}</h3>
        </div>
        <div className="text-gray-medium">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
