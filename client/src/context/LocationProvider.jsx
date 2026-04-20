import React, { useContext, useEffect, useRef, useState } from 'react';
import api from '../utils/axios';
import { AuthContext } from './authContext';
import { LocationContext } from './locationContext';
import { getBrowserCoordinates } from '../utils/browserLocation';
import LocationModal from '../components/LocationModal';

const formatLocationLabel = (u) => {
    const city = String(u?.city || '').trim();
    const district = String(u?.district || '').trim();
    const state = String(u?.state || '').trim();
    const parts = [];
    if (city) parts.push(city);
    if (district) parts.push(district);
    if (state) parts.push(state);
    return parts.length ? parts.join(' · ') : 'Location not set';
};

export function LocationProvider({ children }) {
    const { user, updateUserProfile } = useContext(AuthContext);
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [savingLocation, setSavingLocation] = useState(false);
    const loginGpsRef = useRef('');

    const supportsNearbyEvents = Boolean(user && user.role !== 'client');
    const hasStoredLocation = Boolean(
        (String(user?.stateCode || '').trim() && String(user?.district || '').trim()) ||
            (String(user?.state || '').trim() &&
                String(user?.district || '').trim() &&
                !String(user?.stateCode || '').trim())
    );

    const saveManualLocation = async ({ city, district, stateCode }) => {
        setSavingLocation(true);
        try {
            const { data } = await api.put('/users/location', { city, district, stateCode });
            updateUserProfile(data.user);
            setManualModalOpen(false);
            return data.user;
        } finally {
            setSavingLocation(false);
        }
    };

    const requestBrowserLocation = async ({ openManualOnError = false, force = false } = {}) => {
        if (!supportsNearbyEvents) {
            return null;
        }

        if (!force && hasStoredLocation) {
            return user;
        }

        setSavingLocation(true);

        try {
            const coordinates = await getBrowserCoordinates();
            const { data } = await api.put('/users/location', coordinates);
            updateUserProfile(data.user);
            setManualModalOpen(false);
            return data.user;
        } catch (error) {
            if (openManualOnError) {
                setManualModalOpen(true);
            }
            throw error;
        } finally {
            setSavingLocation(false);
        }
    };

    useEffect(() => {
        if (!supportsNearbyEvents || !user?._id) {
            return;
        }

        const k = `vireon-gps-login-${user._id}`;
        if (loginGpsRef.current === k || sessionStorage.getItem(k)) {
            return;
        }

        loginGpsRef.current = k;
        sessionStorage.setItem(k, '1');

        requestBrowserLocation({ openManualOnError: true, force: true }).catch(() => {});
    }, [supportsNearbyEvents, user?._id]);

    const value = {
        hasStoredLocation,
        locationLabel: formatLocationLabel(user),
        manualModalOpen,
        openManualLocationModal: () => setManualModalOpen(true),
        closeManualLocationModal: () => setManualModalOpen(false),
        requestBrowserLocation,
        saveManualLocation,
        savingLocation
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
            <LocationModal
                isOpen={manualModalOpen}
                loading={savingLocation}
                initialCity={user?.city || ''}
                initialDistrict={user?.district || ''}
                initialStateCode={user?.stateCode || ''}
                onClose={() => setManualModalOpen(false)}
                onSubmit={saveManualLocation}
                onUseCurrentLocation={supportsNearbyEvents ? requestBrowserLocation : undefined}
            />
        </LocationContext.Provider>
    );
}
