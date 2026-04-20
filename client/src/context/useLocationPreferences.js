import { useContext } from 'react';
import { LocationContext } from './locationContext';

export function useLocationPreferences() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocationPreferences must be used inside a LocationProvider');
    }
    return context;
}
