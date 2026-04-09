import React, { useState } from 'react';
import { FaShare, FaWhatsapp, FaFacebook, FaTwitter, FaLink } from 'react-icons/fa';

const ShareEvent = ({ event, eventId, eventTitle }) => {
    const [showShare, setShowShare] = useState(false);

    const resolvedEventId = eventId || event?._id;
    const resolvedEventTitle = eventTitle || event?.title || 'this event';

    if (!resolvedEventId) {
        return null;
    }

    const eventUrl = `${window.location.origin}/events/${resolvedEventId}`;
    const eventText = `Check out ${resolvedEventTitle} on Vireon!`;

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(eventUrl);
        alert('Event link copied to clipboard!');
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${eventText} ${eventUrl}`)}`;
        window.open(url, '_blank');
    };

    const handleFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
        window.open(url, '_blank');
    };

    const handleTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventText)}&url=${encodeURIComponent(eventUrl)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowShare(!showShare)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg font-semibold transition"
            >
                <FaShare /> Share
            </button>

            {showShare && (
                <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl p-3 z-10 space-y-2 w-48">
                    <button
                        onClick={handleWhatsApp}
                        className="w-full flex items-center gap-3 p-3 text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                        <FaWhatsapp className="text-xl" /> WhatsApp
                    </button>
                    <button
                        onClick={handleFacebook}
                        className="w-full flex items-center gap-3 p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                        <FaFacebook className="text-xl" /> Facebook
                    </button>
                    <button
                        onClick={handleTwitter}
                        className="w-full flex items-center gap-3 p-3 text-sky-500 hover:bg-sky-50 rounded-lg transition"
                    >
                        <FaTwitter className="text-xl" /> Twitter
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition border-t border-gray-200"
                    >
                        <FaLink /> Copy Link
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShareEvent;
