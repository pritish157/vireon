import React from 'react';

export default function LegalPageLayout({ eyebrow = 'Legal', title, lastUpdated, children }) {
    return (
        <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">{eyebrow}</p>
                        <h1 className="mt-3 text-3xl font-extrabold text-gray-900">{title}</h1>
                    </div>
                    {lastUpdated && (
                        <p className="text-xs font-semibold text-gray-500">
                            Last updated: <span className="text-gray-700">{lastUpdated}</span>
                        </p>
                    )}
                </div>

                <div className="mt-8 space-y-6 text-sm leading-6 text-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
}

