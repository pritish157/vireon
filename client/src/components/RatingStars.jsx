import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';

const RatingStars = ({ maxStars = 5, onRate, initialRating = 0 }) => {
    const [rating, setRating] = useState(initialRating);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleRate = (stars) => {
        setRating(stars);
        if (onRate) onRate(stars);
    };

    return (
        <div className="flex gap-2">
            {Array.from({ length: maxStars }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => handleRate(i + 1)}
                    onMouseEnter={() => setHoveredRating(i + 1)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-2xl transition transform hover:scale-110"
                >
                    {i + 1 <= (hoveredRating || rating) ? (
                        <FaStar className="text-yellow-400" />
                    ) : (
                        <FaRegStar className="text-gray-300" />
                    )}
                </button>
            ))}
            {rating > 0 && <span className="ml-2 text-gray-600 font-semibold">{rating} / {maxStars}</span>}
        </div>
    );
};

export default RatingStars;