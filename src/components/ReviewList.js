// src/components/ReviewList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios to use your Flask backend
const API_BASE = 'http://localhost:5000';
axios.defaults.baseURL = API_BASE;

function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // In a real app, you'd fetch pending reviews from your backend
  // This is simplified to simulate new reviews arriving and needing action
  useEffect(() => {
    // Simulate fetching reviews from your API that are 'pending_approval'
    const fetchReviews = async () => {
      try {
        // Assuming your backend has an endpoint to list reviews awaiting approval
        const response = await axios.get('/api/reviews/pending');
        setReviews(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load reviews. Please try again.");
        setLoading(false);
        console.error("Error fetching reviews:", err);
      }
    };
    
    fetchReviews();

    // Simulate new reviews coming in via a webhook handled by the backend
    // In a real app, you'd use WebSockets for real-time updates or polling
    const simulateNewReview = () => {
      const reviewTexts = [
        "The pet bed is so soft! My fur baby loves it.",
        "Packaging was a bit damaged, but the pet food arrived safely.",
        "Amazing quality handmade jewelry! Will definitely order again.",
        "The earrings are beautiful but took longer to arrive than expected.",
        "Excellent customer service and fast shipping. Highly recommend!",
        "The necklace broke after just a few days of wearing.",
        "Perfect gift for my daughter. She absolutely loves it!",
        "Good value for money, though the design could be improved."
      ];
      
      const newReview = {
        id: `review_${Date.now()}`,
        product_id: `prod_${Math.floor(Math.random() * 1000)}`,
        reviewer_name: `Customer ${Math.floor(Math.random() * 100)}`,
        customer_name: `Customer ${Math.floor(Math.random() * 100)}`,
        review_text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        rating: Math.random() > 0.7 ? 5 : (Math.random() > 0.5 ? 4 : (Math.random() > 0.3 ? 3 : 2)),
        ai_draft: "Generating...", // Initial state
        status: "pending_approval",
        timestamp: new Date().toISOString(),
        platform: 'demo'
      };
      
      // Call backend webhook (simulated)
      axios.post('/webhook/new-review', newReview)
        .then(res => {
          console.log('Simulated webhook sent:', res.data);
          // Update state to reflect new review and AI draft
          setReviews(prevReviews => [{
            ...newReview,
            ai_draft: res.data.ai_reply_draft || "Could not generate reply.",
            ai_response: res.data.ai_reply_draft || "Could not generate reply."
          }, ...prevReviews]);
        })
        .catch(err => console.error('Simulated webhook error:', err));
    };

    const interval = setInterval(simulateNewReview, 30000); // New review every 30 seconds for demo
    return () => clearInterval(interval);

  }, []);

  const handlePublishReply = async (reviewId, approvedReply) => {
    try {
      const response = await axios.post('/publish-reply', {
        review_id: reviewId,
        approved_reply: approvedReply,
      });
      
      if (response.status === 200) {
        setReviews(reviews.map(review =>
          review.id === reviewId
            ? { ...review, status: 'published', published_reply: approvedReply }
            : review
        ));
        alert('Reply published successfully!');
      }
    } catch (err) {
      alert('Failed to publish reply.');
      console.error('Error publishing reply:', err);
    }
  };

  const handleRejectReview = async (reviewId) => {
    try {
      const response = await axios.post(`/reviews/${reviewId}/reject`);
      
      if (response.status === 200) {
        setReviews(reviews.filter(review => review.id !== reviewId));
        alert('Review rejected successfully!');
      }
    } catch (err) {
      alert('Failed to reject review.');
      console.error('Error rejecting review:', err);
    }
  };

  if (loading) return <div className="loading">Loading reviews...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="review-list">
      <h1>Reviews Awaiting Approval</h1>
      {reviews.length === 0 && <p>No reviews awaiting approval right now. Check back later!</p>}
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onPublish={handlePublishReply}
          onReject={handleRejectReview}
        />
      ))}
    </div>
  );
}

function ReviewItem({ review, onPublish, onReject }) {
  const [editedReply, setEditedReply] = useState(review.ai_draft || review.ai_response || '');

  useEffect(() => {
    setEditedReply(review.ai_draft || review.ai_response || ''); // Update if AI draft changes
  }, [review.ai_draft, review.ai_response]);

  const isPublished = review.status === 'published';
  const isGenerating = editedReply === "Generating...";

  return (
    <div className={`review-card ${isPublished ? 'published' : ''}`}>
      <h3>Review for Product ID: {review.product_id}</h3>
      <p><strong>Reviewer:</strong> {review.reviewer_name || review.customer_name}</p>
      <p><strong>Rating:</strong> {review.review_rating || review.rating} / 5 ⭐</p>
      <p className="review-text">"{review.review_text}"</p>

      {!isPublished ? (
        <>
          <hr />
          <h4>AI Generated Draft Reply:</h4>
          <textarea
            value={editedReply}
            onChange={(e) => setEditedReply(e.target.value)}
            rows="4"
            className="ai-reply-textarea"
            disabled={isGenerating}
            placeholder="AI-generated response will appear here..."
          />
          <div className="review-actions">
            <button
              onClick={() => onReject(review.id)}
              className="reject-btn"
              disabled={isGenerating}
            >
              Reject
            </button>
            <button
              onClick={() => onPublish(review.id, editedReply)}
              disabled={!editedReply || isGenerating}
              className="approve-btn"
            >
              {isGenerating ? "Generating..." : "Approve & Publish"}
            </button>
            {/* More options: Regenerate, Delete Draft etc. */}
          </div>
        </>
      ) : (
        <>
          <hr />
          <h4>Published Reply:</h4>
          <p className="published-reply-text">"{review.published_reply || editedReply}"</p>
          <span className="published-tag">Published</span>
        </>
      )}
    </div>
  );
}

export default ReviewList;
