import React from 'react';

interface CardSkeletonProps {
  count?: number;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((index) => (
        <div
          key={index}
          className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse p-3"
        >
          {/* 图标骨架 */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0" />

            {/* 内容骨架 */}
            <div className="flex-1 min-w-0">
              {/* 标题骨架 */}
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
            </div>

            {/* 操作按钮骨架 */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;
