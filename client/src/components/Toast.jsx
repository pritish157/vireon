import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    const typeIcons = {
        success: <FaCheckCircle />,
        error: <FaTimesCircle />,
        warning: <FaExclamationCircle />,
        info: <FaInfoCircle />
    };

    return (
        <div className={`${typeStyles[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-bounce`}>
            <span className="text-xl">{typeIcons[type]}</span>
            <span>{message}</span>
        </div>
    );
};

export default Toast;