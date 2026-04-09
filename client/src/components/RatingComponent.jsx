import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const RatingComponent = ({ eventId, onRateSubmit }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        const reviews = JSON.parse(localStorage.getItem(`reviews_${eventId}`) || '[]');
        reviews.push({
            rating,
            review,
            date: new Date().toLocaleDateString()
        });
        localStorage.setItem(`reviews_${eventId}`, JSON.stringify(reviews));

        setRating(0);
        setReview('');
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 2000);

        if (onRateSubmit) onRateSubmit();
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rate This Event</h3>

            <form onSubmit={handleSubmit}>
                {/* Star Rating */}
                <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Rating</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="text-3xl transition transform hover:scale-110"
                            >
                                <FaStar
                                    fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'}
                                    className={star <= (hoveredRating || rating) ? 'text-yellow-400' : 'text-gray-300'}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Your Review</label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience with this event..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                        rows="4"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                    Submit Review
                </button>

                {submitted && (
                    <p className="text-green-600 text-sm mt-2">✅ Review submitted successfully!</p>
                )}
            </form>
        </div>
    );
};

// Display Reviews Component
export const ReviewsList = ({ eventId }) => {
    const reviews = JSON.parse(localStorage.getItem(`reviews_${eventId}`) || '[]');
    const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 0;

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'} />
                        ))}
                    </div>
                    <span className="text-lg font-bold text-gray-900">{avgRating}</span>
                </div>
                <p className="text-sm text-gray-600">{reviews.length} reviews</p>
            </div>

            {reviews.length === 0 ? (
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review, idx) => (
                        <div key={idx} className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">{review.date}</span>
                            </div>
                            {review.review && <p className="text-gray-700 text-sm">{review.review}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RatingComponent;