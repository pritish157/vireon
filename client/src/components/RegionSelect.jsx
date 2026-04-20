import React, { useMemo } from 'react';
import { getAllStates, getDistricts } from 'india-state-district';

const inputClass =
    'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10';

const RegionSelect = ({
    stateCode = '',
    district = '',
    onChange,
    disabled = false,
    stateLabel = 'State',
    districtLabel = 'District',
    className = ''
}) => {
    const states = useMemo(() => getAllStates().sort((a, b) => a.name.localeCompare(b.name)), []);
    const districts = useMemo(() => (stateCode ? getDistricts(stateCode) : []).sort((a, b) => a.localeCompare(b)), [stateCode]);

    return (
        <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
            <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{stateLabel}</label>
                <select
                    required
                    disabled={disabled}
                    className={inputClass}
                    value={stateCode}
                    onChange={(e) => {
                        const next = e.target.value;
                        onChange({ stateCode: next, district: '' });
                    }}
                >
                    <option value="">Select state</option>
                    {states.map((s) => (
                        <option key={s.code} value={s.code}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{districtLabel}</label>
                <select
                    required
                    disabled={disabled || !stateCode}
                    className={inputClass}
                    value={district}
                    onChange={(e) => onChange({ stateCode, district: e.target.value })}
                >
                    <option value="">{stateCode ? 'Select district' : 'Select state first'}</option>
                    {districts.map((d) => (
                        <option key={d} value={d}>
                            {d}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default RegionSelect;
