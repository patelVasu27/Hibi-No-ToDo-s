import React from 'react';
import { SortIcon } from './Icons';

interface SortControlProps {
    sortOrder: string;
    onSortChange: (newOrder: string) => void;
}

const SortControl: React.FC<SortControlProps> = ({ sortOrder, onSortChange }) => {
    return (
        <div className="relative flex items-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg w-full sm:w-auto sm:max-w-xs">
            <label htmlFor="sort-order" className="pl-3 pr-2 text-gray-400">
                <SortIcon className="h-5 w-5" />
                <span className="sr-only">Sort by</span>
            </label>
            <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full appearance-none bg-transparent py-2 pl-1 pr-8 text-white focus:outline-none"
            >
                <option value="default" className="bg-gray-800">Smart Sort</option>
                <option value="manual" className="bg-gray-800">Manual Order</option>
                <option value="importance" className="bg-gray-800">By Importance</option>
                <option value="dueDate" className="bg-gray-800">By Due Date</option>
                <option value="creation" className="bg-gray-800">By Creation Date</option>
            </select>
        </div>
    );
};

export default SortControl;