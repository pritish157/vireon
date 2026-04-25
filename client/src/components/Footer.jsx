import React from 'react';
import { Link } from 'react-router-dom';
import { FaTicketAlt, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-16 border-t border-gray-200 bg-white/90 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-12 md:py-14">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <FaTicketAlt className="text-2xl text-gray-900" />
                            <span className="text-xl font-black text-gray-900">Vireon</span>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-gray-600">
                            Discover and book events with a clean, secure, location-aware experience for users and a simple
                            approval workflow for organizers.
                        </p>
                        <div className="mt-6 flex flex-col gap-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                                <FaEnvelope className="text-gray-400" />
                                <a className="font-semibold hover:underline" href="mailto:support@vireon.com">
                                    support@vireon.com
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaPhoneAlt className="text-gray-400" />
                                <a className="font-semibold hover:underline" href="tel:+910000000000">
                                    +91 00000 00000
                                </a>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Company</p>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li>
                                <Link className="font-semibold text-gray-800 hover:underline" to="/">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link className="font-semibold text-gray-800 hover:underline" to="/dashboard">
                                    User Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link className="font-semibold text-gray-800 hover:underline" to="/client/dashboard">
                                    Client Portal
                                </Link>
                            </li>
                            <li>
                                <Link className="font-semibold text-gray-800 hover:underline" to="/admin">
                                    Admin Panel
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Help & Support</p>
                        <ul className="mt-4 space-y-3 text-sm text-gray-700">
                            <li className="font-medium">Support hours: Mon-Sat, 10:00-18:00 IST</li>
                            <li className="font-medium">Response SLA: within 24 hours</li>
                            <li className="font-medium">For refunds: contact support with your booking ID</li>
                            <li>
                                <a className="font-semibold text-gray-800 hover:underline" href="mailto:help@vireon.com">
                                    help@vireon.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">Admin Office</p>
                        <div className="mt-4 space-y-3 text-sm text-gray-700">
                            <div className="flex items-start gap-2">
                                <FaMapMarkerAlt className="mt-0.5 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-gray-900">Vireon Operations</p>
                                    <p className="font-medium">
                                        3rd Floor, Tech Park Building, Jaydev Vihar, Bhubaneswar, Odisha 751013, India
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Replace this address/phone/email with your official production contact details before deploying.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-600">
                        Copyright {year} Vireon. All rights reserved.
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <Link className="font-semibold text-gray-700 hover:underline" to="/terms">
                            Terms
                        </Link>
                        <Link className="font-semibold text-gray-700 hover:underline" to="/privacy">
                            Privacy
                        </Link>
                        <Link className="font-semibold text-gray-700 hover:underline" to="/refund-policy">
                            Refund Policy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
