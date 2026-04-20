import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { useLocationPreferences } from '../context/useLocationPreferences';

const LocationSettingsCard = () => {
    const { user } = useContext(AuthContext);
    const {
        locationLabel,
        openManualLocationModal,
        requestBrowserLocation,
        savingLocation
    } = useLocationPreferences();
    const [error, setError] = useState('');

    const handleUseCurrentLocation = async () => {
        setError('');
        try {
            await requestBrowserLocation({ openManualOnError: true, force: true });
        } catch (locationError) {
            setError(locationError?.message || 'Unable to access your current location right now.');
        }
    };

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Location Settings</p>
                    <h2 className="mt-3 text-2xl font-extrabold text-gray-900">Nearby event preferences</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Saved area for {user?.name} (state · district · optional city):{' '}
                        <span className="font-semibold text-gray-900">{locationLabel}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={handleUseCurrentLocation}
                        disabled={savingLocation}
                        className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {savingLocation ? 'Updating...' : 'Use Current Location'}
                    </button>
                    <button
                        onClick={openManualLocationModal}
                        className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Update Manually
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LocationSettingsCard;
