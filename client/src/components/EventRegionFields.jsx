import React from 'react';
import RegionSelect from './RegionSelect';

const fieldClass =
    'border px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-gray-700 outline-none transition';

const EventRegionFields = ({ formData, setFormData, disabled = false }) => (
    <div className="md:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Venue &amp; region (India)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                required
                type="text"
                placeholder="Street / venue address"
                disabled={disabled}
                className={fieldClass}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <input
                type="text"
                placeholder="City / area (optional)"
                disabled={disabled}
                className={fieldClass}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
        </div>
        <RegionSelect
            stateCode={formData.stateCode || ''}
            district={formData.district || ''}
            disabled={disabled}
            onChange={({ stateCode, district }) => setFormData({ ...formData, stateCode, district })}
        />
    </div>
);

export default EventRegionFields;
