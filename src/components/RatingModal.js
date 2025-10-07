import React, { useState } from 'react';
import Modal from './Modal';

const RatingModal = ({ isOpen, onClose, booking, onSubmitRating }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    if (!booking) {
        return null;
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmitRating({
                bookingId: booking._id || booking.id || null, // May not exist for history items
                coachId: booking.coachId,
                coachName: booking.coachName,
                rating,
                comment: comment.trim(),
                date: booking.date,
                time: booking.time,
                class: booking.class
            });
            
            // Reset form
            setRating(0);
            setComment('');
            onClose();
        } catch (error) {
            console.error('Error submitting rating:', error);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setComment('');
        setHoveredRating(0);
        onClose();
    };

    return (
        <Modal open={isOpen} onClose={handleClose}>
            <div style={{ minWidth: '400px', maxWidth: '500px' }}>
                <h2 style={{ 
                    color: '#2c3e50', 
                    marginBottom: 20, 
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    Rate Your Coach
                </h2>
                
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: 16, 
                    borderRadius: 8, 
                    marginBottom: 20,
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: 8 }}>
                        {booking.coachName}
                    </div>
                    <div style={{ fontSize: 14, color: '#6c757d', marginBottom: 4 }}>
                        Class: {booking.class || 'Boxing'}
                    </div>
                    <div style={{ fontSize: 14, color: '#6c757d' }}>
                        {booking.date} at {booking.time}
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: 12, 
                        fontWeight: 'bold', 
                        color: '#495057' 
                    }}>
                        How would you rate this coach?
                    </label>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 8, 
                        marginBottom: 16 
                    }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 32,
                                    cursor: 'pointer',
                                    color: (hoveredRating || rating) >= star ? '#ffc107' : '#e9ecef',
                                    transition: 'color 0.2s ease',
                                    padding: 4
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    
                    <div style={{ textAlign: 'center', fontSize: 14, color: '#6c757d' }}>
                        {rating > 0 && (
                            <span>
                                {rating === 1 && "Poor"}
                                {rating === 2 && "Fair"}
                                {rating === 3 && "Good"}
                                {rating === 4 && "Very Good"}
                                {rating === 5 && "Excellent"}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: 8, 
                        fontWeight: 'bold', 
                        color: '#495057' 
                    }}>
                        Comments (Optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this coach..."
                        style={{
                            width: '100%',
                            minHeight: 80,
                            padding: 12,
                            border: '1px solid #ced4da',
                            borderRadius: 6,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none'
                        }}
                        maxLength={500}
                    />
                    <div style={{ 
                        textAlign: 'right', 
                        fontSize: 12, 
                        color: '#6c757d', 
                        marginTop: 4 
                    }}>
                        {comment.length}/500
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    justifyContent: 'flex-end' 
                }}>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: isSubmitting ? 0.6 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        style={{
                            background: rating === 0 || isSubmitting ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            padding: '10px 20px',
                            cursor: rating === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: rating === 0 || isSubmitting ? 0.6 : 1
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RatingModal;
