import React, { useEffect, useMemo, useRef, useState } from 'react';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const getCardWidth = () => {
    if (typeof window === 'undefined') return 360;
    const w = window.innerWidth;
    if (w < 480) return 280;
    if (w < 768) return 320;
    return 360;
};

export default function EventCarousel({
    events,
    renderItem,
    autoPlay = true,
    intervalMs = 4500,
    title,
    subtitle,
    rightSlot
}) {
    const scrollerRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState(getCardWidth());

    const count = Array.isArray(events) ? events.length : 0;

    useEffect(() => {
        const onResize = () => setCardWidth(getCardWidth());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const canAutoPlay = autoPlay && count > 1;

    const scrollToIndex = (idx) => {
        const next = clamp(idx, 0, Math.max(0, count - 1));
        setActiveIndex(next);
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ left: next * (cardWidth + 16), behavior: 'smooth' });
    };

    useEffect(() => {
        if (!canAutoPlay) return;
        const id = window.setInterval(() => {
            setActiveIndex((curr) => {
                const next = (curr + 1) % count;
                const el = scrollerRef.current;
                if (el) el.scrollTo({ left: next * (cardWidth + 16), behavior: 'smooth' });
                return next;
            });
        }, intervalMs);
        return () => window.clearInterval(id);
    }, [canAutoPlay, count, intervalMs, cardWidth]);

    const dots = useMemo(() => {
        if (count <= 1) return [];
        const maxDots = 8;
        if (count <= maxDots) return Array.from({ length: count }, (_, i) => i);
        return Array.from({ length: maxDots }, (_, i) => Math.round((i * (count - 1)) / (maxDots - 1)));
    }, [count]);

    if (!count) return null;

    return (
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            {(title || subtitle || rightSlot) && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        {title && <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>}
                        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{subtitle}</p>}
                    </div>
                    {rightSlot && <div className="shrink-0">{rightSlot}</div>}
                </div>
            )}

            <div className="mt-6 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

                <div
                    ref={scrollerRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                    onScroll={(e) => {
                        const left = e.currentTarget.scrollLeft || 0;
                        const idx = Math.round(left / (cardWidth + 16));
                        setActiveIndex(clamp(idx, 0, Math.max(0, count - 1)));
                    }}
                >
                    {events.map((event, idx) => (
                        <div
                            key={event?._id || idx}
                            className="snap-start shrink-0"
                            style={{ width: cardWidth }}
                        >
                            {renderItem(event, idx)}
                        </div>
                    ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => scrollToIndex(activeIndex - 1)}
                            disabled={activeIndex <= 0}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollToIndex(activeIndex + 1)}
                            disabled={activeIndex >= count - 1}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>

                    {dots.length > 0 && (
                        <div className="flex items-center justify-end gap-1.5">
                            {dots.map((dotIndex) => (
                                <button
                                    key={dotIndex}
                                    type="button"
                                    onClick={() => scrollToIndex(dotIndex)}
                                    className={`h-2.5 rounded-full transition ${
                                        Math.abs(dotIndex - activeIndex) <= 0
                                            ? 'w-6 bg-gray-900'
                                            : 'w-2.5 bg-gray-200 hover:bg-gray-300'
                                    }`}
                                    aria-label={`Go to item ${dotIndex + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

