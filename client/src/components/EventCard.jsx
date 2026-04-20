import React from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
    const availablePercent = event.availableSeats > 0 
        ? Math.round((event.availableSeats / event.totalSeats) * 100) 
        : 0;

    return (
        <Link to={`/events/${event._id}`}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer h-full flex flex-col">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                    <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {event.category}
                    </div>
                    {/* Seat Status */}
                    <div className="absolute top-4 right-4">
                        {availablePercent > 50 ? (
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                {availablePercent}% Available
                            </div>
                        ) : availablePercent > 0 ? (
                            <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Few Left!
                            </div>
                        ) : (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                Sold Out
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600">
                        {event.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {event.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4 text-sm text-gray-700 flex-1">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-blue-600" />
                            <span>{new Date(event.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-600 shrink-0" />
                            <span className="truncate">{event.location}</span>
                        </div>
                        {(event.city || event.district || event.state) && (
                            <div className="flex items-start gap-2 text-xs text-gray-500 pl-7">
                                <span className="line-clamp-2">
                                    {[event.city, event.district, event.state].filter(Boolean).join(' · ')}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <FaChair className="text-purple-600" />
                            <span>{event.availableSeats} of {event.totalSeats} seats</span>
                        </div>
                    </div>

                    {/* Price & Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <FaMoneyBillWave className="text-green-600" />
                            <span className="text-2xl font-bold text-gray-900">
                                {event.ticketPrice === 0 ? 'Free' : `₹${event.ticketPrice}`}
                            </span>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;
