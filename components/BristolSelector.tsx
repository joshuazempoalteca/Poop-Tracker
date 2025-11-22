import React from 'react';
import { BRISTOL_SCALE_DATA } from '../constants';
import { BristolType } from '../types';

interface BristolSelectorProps {
  selected: BristolType;
  onSelect: (type: BristolType) => void;
}

export const BristolSelector: React.FC<BristolSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-brown-800 dark:text-stone-300">
        What did it look like? (Bristol Scale)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BRISTOL_SCALE_DATA.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onSelect(item.type)}
            className={`
              flex items-center p-3 rounded-xl border-2 transition-all duration-200
              ${selected === item.type 
                ? 'border-brown-600 bg-brown-100 dark:bg-stone-800 dark:border-brown-500 shadow-md' 
                : 'border-transparent bg-white dark:bg-stone-800/50 hover:bg-brown-50 dark:hover:bg-stone-800'
              }
            `}
          >
            <div className={`
              w-10 h-10 flex items-center justify-center rounded-full text-xl shadow-inner
              ${item.color} text-white mr-3 shrink-0
            `}>
              {item.icon}
            </div>
            <div className="text-left">
              <div className={`font-bold ${selected === item.type ? 'text-brown-900 dark:text-stone-100' : 'text-brown-900 dark:text-stone-300'}`}>Type {item.type}</div>
              <div className={`text-xs ${selected === item.type ? 'text-brown-700 dark:text-stone-400' : 'text-brown-600 dark:text-stone-500'}`}>{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};