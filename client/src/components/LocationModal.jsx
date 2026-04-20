import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaCrosshairs, FaTimes } from 'react-icons/fa';
import RegionSelect from './RegionSelect';

const LocationModal = ({
    isOpen,
    loading,
    initialCity = '',
    initialDistrict = '',
    initialStateCode = '',
    onClose,
    onSubmit,
    onUseCurrentLocation
}) => {
    const [city, setCity] = useState(initialCity);
    const [district, setDistrict] = useState(initialDistrict);
    const [stateCode, setStateCode] = useState(initialStateCode);
    const [error, setError] = useState('');

    useEffect(() => {
        setCity(initialCity);
        setDistrict(initialDistrict);
        setStateCode(initialStateCode);
        setError('');
    }, [initialCity, initialDistrict, initialStateCode, isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleDetect = async () => {
        setError('');
        try {
            await onUseCurrentLocation?.({ force: true, openManualOnError: true });
        } catch {
            setError('Could not detect location. Pick state and district below.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stateCode) {
            setError('Please select your state.');
            return;
        }
        if (!district) {
            setError('Please select your district.');
            return;
        }

        setError('');
        await onSubmit({
            city: city.trim(),
            district,
            stateCode
        });
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
                aria-label="Close location dialog"
            />

            <div className="relative w-full max-w-lg rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm sm:rounded-t-3xl">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-md">
                            <FaMapMarkerAlt className="text-lg" />
                        </span>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-gray-500">Your area</p>
                            <h2 id="location-modal-title" className="mt-1 text-xl font-black tracking-tight text-gray-900">
                                Where should we show events?
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">
                                GPS saves district &amp; state to your profile. Or choose from the official India lists. Events are
                                matched by <span className="font-semibold text-gray-900">district first</span>, then your whole{' '}
                                <span className="font-semibold text-gray-900">state</span> if none are listed in your district.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        aria-label="Close"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                <div className="px-6 pb-6 pt-5">
                    <button
                        type="button"
                        onClick={handleDetect}
                        disabled={loading || !onUseCurrentLocation}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-3.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <FaCrosshairs className={loading ? 'animate-pulse' : ''} />
                        {loading ? 'Finding your location…' : 'Use current location (GPS)'}
                    </button>
                    <p className="mt-2 text-center text-xs text-gray-500">
                        Uses your browser and saves state, district, city &amp; country when possible.
                    </p>

                    <div className="my-6 flex items-center gap-3">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">or select manually</span>
                        <span className="h-px flex-1 bg-gray-200" />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <RegionSelect
                            stateCode={stateCode}
                            district={district}
                            disabled={loading}
                            onChange={({ stateCode: sc, district: d }) => {
                                setStateCode(sc);
                                setDistrict(d);
                            }}
                        />

                        <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                                City / area <span className="font-normal normal-case text-gray-400">(optional)</span>
                            </label>
                            <input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Indiranagar"
                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                            />
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="order-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50 sm:order-1"
                            >
                                Not now
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="order-1 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-gray-900/20 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 sm:order-2"
                            >
                                {loading ? 'Saving…' : 'Save & show nearby events'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
