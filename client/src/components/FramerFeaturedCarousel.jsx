import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import EventCard from './EventCard';
import useIsMobileViewport from '../hooks/useIsMobileViewport';

export default function FramerFeaturedCarousel({ events, title, subtitle }) {
    const [[page, direction], setPage] = useState([0, 0]);
    const isMobile = useIsMobileViewport();

    const itemsPerPage = isMobile ? 1 : 3;
    const totalPages = Math.ceil(events.length / itemsPerPage);

    useEffect(() => {
        // Reset page if category changes and current page is out of bounds
        if (page >= totalPages && totalPages > 0) {
            setPage([0, 0]);
        }
    }, [events.length, totalPages, page]);

    const paginate = (newDirection) => {
        const nextPage = page + newDirection;
        if (nextPage >= 0 && nextPage < totalPages) {
            setPage([nextPage, newDirection]);
        }
    };

    const variants = {
        enter: (direction) => {
            return {
                x: direction > 0 ? 1000 : -1000,
                opacity: 0
            };
        },
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => {
            return {
                zIndex: 0,
                x: direction < 0 ? 1000 : -1000,
                opacity: 0
            };
        }
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset, velocity) => {
        return Math.abs(offset) * velocity;
    };

    if (events.length === 0) {
        return (
            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                {title && <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>}
                {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
                <div className="mt-8 rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
                    No featured events found for this category.
                </div>
            </section>
        );
    }

    const currentItems = events.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    return (
        <section className="rounded-[2rem] bg-white p-4 shadow-lg ring-1 ring-gray-100 md:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    {title && <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>}
                    {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{subtitle}</p>}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => paginate(-1)}
                            disabled={page === 0}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            onClick={() => paginate(1)}
                            disabled={page === totalPages - 1}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative overflow-hidden" style={{ minHeight: isMobile ? '450px' : '400px' }}>
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag={isMobile ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);

                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1);
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1);
                            }
                        }}
                        className={`grid gap-4 md:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}
                    >
                        {currentItems.map((event) => (
                            <div key={event._id} className="h-full">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
