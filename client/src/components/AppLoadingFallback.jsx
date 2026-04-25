import React from 'react';

const shimmerCard = 'animate-pulse rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur';

const AppLoadingFallback = () => {
    return (
        <div className="space-y-6 md:space-y-8">
            <div className="md:hidden rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-xl">
                <div className="h-3 w-28 rounded-full bg-white/20" />
                <div className="mt-4 h-9 w-56 rounded-2xl bg-white/15" />
                <div className="mt-3 h-4 w-full rounded-full bg-white/10" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-white/10" />
                <div className="mt-5 h-14 rounded-2xl bg-white/10" />
            </div>

            <div className="hidden md:block rounded-3xl bg-slate-950 px-10 py-12 shadow-2xl">
                <div className="h-4 w-36 rounded-full bg-white/15" />
                <div className="mt-6 h-16 w-2/3 rounded-3xl bg-white/10" />
                <div className="mt-4 h-5 w-1/2 rounded-full bg-white/10" />
                <div className="mt-8 h-16 rounded-full bg-white/10" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={shimmerCard}>
                        <div className="h-48 rounded-t-3xl bg-slate-200/80" />
                        <div className="space-y-4 p-5">
                            <div className="h-6 w-3/4 rounded-full bg-slate-200/80" />
                            <div className="h-4 w-full rounded-full bg-slate-100/90" />
                            <div className="h-4 w-5/6 rounded-full bg-slate-100/90" />
                            <div className="h-4 w-1/2 rounded-full bg-slate-100/90" />
                            <div className="h-12 rounded-2xl bg-slate-200/80" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppLoadingFallback;
