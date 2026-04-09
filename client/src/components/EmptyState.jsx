import React from 'react';
import { FaSearch } from 'react-icons/fa';

const EmptyState = ({ title = "No Events Found", description = "Try adjusting your search or filters to find what you're looking for." }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="text-6xl mb-4 opacity-50">
                <FaSearch />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-center max-w-md">{description}</p>
        </div>
    );
};

export default EmptyState;