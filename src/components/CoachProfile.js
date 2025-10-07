import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../designs/coaches.css';

// Helper to render belt colors
function renderBelt(belt) {
    if (!belt) return '';
    const b = belt.toLowerCase();
    if (b === 'black') {
        return (
            <span className="belt">
                <span className="black" style={{ width: 22, height: 12, display: 'inline-block', borderRadius: 2 }}></span>
                <span className="red" style={{ width: 22, height: 12, display: 'inline-block', borderRadius: 2 }}></span>
                <span className="black" style={{ width: 22, height: 12, display: 'inline-block', borderRadius: 2 }}></span>
            </span>
        );
    }
    if (b === 'blue') {
        return (
            <span className="belt">
                <span style={{ width: 66, height: 12, background: '#3498db', display: 'inline-block', borderRadius: 2 }}></span>
            </span>
        );
    }
    if (b === 'purple') {
        return (
            <span className="belt">
                <span style={{ width: 66, height: 12, background: '#8e44ad', display: 'inline-block', borderRadius: 2 }}></span>
            </span>
        );
    }
    if (b === 'brown') {
        return (
            <span className="belt">
                <span style={{ width: 66, height: 12, background: '#a0522d', display: 'inline-block', borderRadius: 2 }}></span>
            </span>
        );
    }
    // Default: just show text
    return <span>{belt}</span>;
}

const CoachProfile = () => {
    const [coach, setCoach] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ratings, setRatings] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [ratingsLoading, setRatingsLoading] = useState(false);
    const location = useLocation();

    const fetchCoach = async () => {
        const query = new URLSearchParams(location.search);
        const coachKey = query.get('coach');
        if (!coachKey) {
            setError('No coach specified.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:3001/api/coaches?username=${coachKey}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                const coachData = data[0] || null;
                setCoach(coachData);
                
                // Fetch ratings for this coach
                if (coachData && coachData._id) {
                    await fetchRatings(coachData._id);
                }
            } else if (data && data.username) {
                setCoach(data);
                
                // Fetch ratings for this coach
                if (data._id) {
                    await fetchRatings(data._id);
                }
            } else {
                setCoach(null);
            }
        } catch (err) {
            setError('Failed to load coach data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchRatings = async (coachId) => {
        setRatingsLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/ratings/coach/${coachId}`);
            const data = await res.json();
            
            if (data.success) {
                setRatings(data.ratings || []);
                setAverageRating(data.averageRating || 0);
                setTotalRatings(data.totalRatings || 0);
            }
        } catch (err) {
            console.error('Failed to load ratings:', err);
        } finally {
            setRatingsLoading(false);
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(<span key={i} style={{ color: '#ffc107', fontSize: '18px' }}>★</span>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<span key={i} style={{ color: '#ffc107', fontSize: '18px' }}>⯨</span>);
            } else {
                stars.push(<span key={i} style={{ color: '#e9ecef', fontSize: '18px' }}>★</span>);
            }
        }
        return stars;
    };

    useEffect(() => {
        fetchCoach();
    }, [location]);

    useEffect(() => {
        // Listen for coaches updates
        const handleCoachesUpdated = () => {
            fetchCoach();
        };
        window.addEventListener('coachesUpdated', handleCoachesUpdated);

        return () => {
            window.removeEventListener('coachesUpdated', handleCoachesUpdated);
        };
    }, [location]);

    if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
    if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;
    if (!coach) return <div style={{ padding: 40, color: 'red' }}>Coach not found.</div>;

    return (
        <>
            <section className="hero" style={{
                background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/images/cage22.png') center/cover no-repeat",
                height: 220, padding: 0, margin: 0, position: 'relative'
            }}>
                <div style={{ position: 'absolute', left: 650, bottom: 10, zIndex: 2, textAlign: 'left' }}>
                    <h1 style={{ fontSize: '2.7rem', fontWeight: 'bold', margin: 0, letterSpacing: 2, lineHeight: 1.2, color: '#fff' }}>{coach.firstname?.toUpperCase()} {coach.lastname?.toUpperCase()}</h1>
                    <div className="subtitle" style={{ fontSize: '1.15rem', marginTop: 10, display: 'flex', alignItems: 'center', gap: 18, color: '#fff' }}>
                        {coach.title || ''}
                        <span style={{ display: 'flex', gap: 10 }}>
                            {coach.socials && coach.socials.map((s, i) => (
                                <a key={i} href={s.url} style={{ color: '#fff' }}><i className={`fa fa-${s.icon}`}></i></a>
                            ))}
                        </span>
                    </div>
                </div>
                <div className="coach-photo" style={{ position: 'absolute', left: 450, bottom: -50, zIndex: 3 }}>
                    <img src={coach.profilePic || '/images/placeholder.jpg'} alt={coach.firstname + ' ' + coach.lastname} style={{ width: 140, height: 140, borderRadius: '50%', border: '6px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', objectFit: 'cover', background: '#fff' }} />
                </div>
            </section>
            <div style={{ background: '#fff', color: '#181818', borderRadius: 0, paddingBottom: 40, marginTop: -45 }}>
                <main className="coach-main" style={{ paddingTop: 80 }}>
                    <section className="coach-details">
                        <Link to="/" className="return-home">&larr; RETURN HOME</Link>
                        <table className="bio-table">
                            <tbody>
                                <tr><td>TITLE:</td><td>{coach.title || ''}</td></tr>
                                <tr><td>DISCIPLINES:</td><td>{coach.specialties?.join(', ') || ''}</td></tr>
                                <tr><td>BELT:</td><td>{renderBelt(coach.belt)}</td></tr>
                                <tr><td>PRO RECORD:</td><td>{coach.proRecord || ''}</td></tr>
                                <tr><td>CLASSES:</td><td>{coach.specialties?.join(', ') || ''}</td></tr>
                                <tr>
                                    <td>RATING:</td>
                                    <td>
                                        {totalRatings > 0 ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    {renderStars(averageRating)}
                                                </div>
                                                <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                    {averageRating.toFixed(1)}
                                                </span>
                                                <span style={{ color: '#6c757d', fontSize: '14px' }}>
                                                    ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
                                                </span>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No ratings yet</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                    <section className="coach-bio">
                        <h2>BIO</h2>
                        {(coach.biography || '').split('\n').map((line, idx) =>
                            line.trim() ? <p key={idx}>{line}</p> : null
                        )}
                    </section>
                    
                    {/* Reviews Section */}
                    {totalRatings > 0 && (
                        <section className="coach-reviews" style={{ marginTop: '40px' }}>
                            <h2 style={{ color: '#2c3e50', fontWeight: 'bold', marginBottom: '20px' }}>RECENT REVIEWS</h2>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {ratings.slice(0, 10).map((rating, idx) => (
                                    <div key={idx} style={{
                                        background: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        {renderStars(rating.rating)}
                                                    </div>
                                                    <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                                        {rating.rating}/5
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: '#495057' }}>
                                                    {rating.studentName}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                                {new Date(rating.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {rating.comment && (
                                            <div style={{ 
                                                color: '#495057', 
                                                lineHeight: '1.5',
                                                fontStyle: rating.comment ? 'normal' : 'italic'
                                            }}>
                                                "{rating.comment}"
                                            </div>
                                        )}
                                        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                                            Class: {rating.class} • {rating.date} at {rating.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {ratings.length > 10 && (
                                <div style={{ textAlign: 'center', marginTop: '16px', color: '#6c757d', fontSize: '14px' }}>
                                    Showing latest 10 reviews of {totalRatings} total
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </>
    );
};

export default CoachProfile; 