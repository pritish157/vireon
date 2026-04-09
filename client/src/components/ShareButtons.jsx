import React from 'react';
import { FaTwitter, FaFacebook, FaWhatsapp, FaLink } from 'react-icons/fa';

const ShareButtons = ({ eventTitle, eventId }) => {
    const shareUrl = `${window.location.origin}/event/${eventId}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(eventTitle);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="flex gap-3">
            {/* WhatsApp */}
            <a
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition"
            >
                <FaWhatsapp /> Share
            </a>

            {/* Facebook */}
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
                <FaFacebook /> Share
            </a>

            {/* Twitter */}
            <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
            >
                <FaTwitter /> Tweet
            </a>

            {/* Copy Link */}
            <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
                <FaLink /> Copy
            </button>
        </div>
    );
};

export default ShareButtons;