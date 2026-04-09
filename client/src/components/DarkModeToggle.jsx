import React, { useState } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

const DarkModeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const toggleDarkMode = () => {
        const newValue = !isDark;
        setIsDark(newValue);
        localStorage.setItem('darkMode', JSON.stringify(newValue));
        
        if (newValue) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition text-gray-900 dark:text-yellow-400"
            title="Toggle dark mode"
        >
            {isDark ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
        </button>
    );
};

export default DarkModeToggle;