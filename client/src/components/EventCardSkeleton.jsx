import React from 'react';

const EventCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
            {/* Image Skeleton */}
            <div className="h-48 bg-gray-300"></div>
            
            {/* Content Skeleton */}
            <div className="p-5">
                <div className="h-4 bg-gray-300 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded mb-4 w-full"></div>
                <div className="h-3 bg-gray-300 rounded mb-2 w-5/6"></div>
                
                {/* Details skeleton */}
                <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                
                {/* Price & Button skeleton */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-300 rounded w-1/4"></div>
                </div>
            </div>
        </div>
    );
};

export default EventCardSkeleton;