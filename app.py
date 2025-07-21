from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
import json
from threading import Lock
from datetime import datetime
from dotenv import load_dotenv
import hashlib
import hmac

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# --- Configuration (Load from Environment Variables in Production!) ---
# NEVER hardcode API keys directly in your code for production.
# For local testing, you might do: export OPENAI_API_KEY='sk-your-openai-key'
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Simple file-based storage for MVP
REVIEW_DB_FILE = "reviews_db.json"
db_lock = Lock()

def load_reviews():
    if not os.path.exists(REVIEW_DB_FILE):
        return []
    with db_lock, open(REVIEW_DB_FILE, "r") as f:
        return json.load(f)

def save_reviews(reviews):
    with db_lock, open(REVIEW_DB_FILE, "w") as f:
        json.dump(reviews, f, indent=2)

def add_review(review):
    reviews = load_reviews()
    review["created_at"] = datetime.now().isoformat()
    review["updated_at"] = datetime.now().isoformat()
    reviews.insert(0, review)
    save_reviews(reviews)

def update_review_status(review_id, new_status, published_reply=None):
    reviews = load_reviews()
    for r in reviews:
        if r["id"] == review_id:
            r["status"] = new_status
            r["updated_at"] = datetime.now().isoformat()
            if published_reply:
                r["published_reply"] = published_reply
    save_reviews(reviews)

def get_user_brand_tone(user_id):
    # In a real app, you'd load brand tones from a database per user
    # For demo, let's use a placeholder function
    # Example for 'handmade jewelry' niche
    return {
        "tone": "friendly, appreciative, artisanal",
        "key_phrases": ["delicate craftsmanship", "unique design", "passionately crafted", "perfect gift"]
    }

def verify_webhook_signature(payload, signature, secret):
    """Verify webhook signature for security (Shopify example)"""
    if not signature or not secret:
        return False
    
    computed_hmac = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_hmac, signature)

def generate_review_reply_prompt(review_text, review_rating, brand_tone_config, niche_context):
    """
    Enhanced prompt engineering function for generating review replies
    """
    tone = brand_tone_config.get("tone", "friendly and professional")
    key_phrases = ", ".join(brand_tone_config.get("key_phrases", []))
    
    # A more sophisticated prompt based on review sentiment
    if review_rating >= 4:
        sentiment_instruction = "The review is positive. Express sincere gratitude and reinforce the brand's unique qualities."
    elif review_rating == 3:
        sentiment_instruction = "The review is neutral. Acknowledge their feedback and express hope for a better future experience."
    else:
        # Negative review
        sentiment_instruction = "The review is negative. Apologize sincerely, express empathy, offer to resolve the issue, and maintain a calm, professional tone. Avoid being defensive."
    
    prompt = f"""
    You are an AI assistant specialized in generating e-commerce review replies for a {niche_context} business.
    Your goal is to craft a reply that is:
    - {tone}
    - Concise (max 3-4 sentences)
    - Directly addresses the review content
    - Incorporates key brand phrases when appropriate: {key_phrases}
    - Follows specific instructions based on review sentiment.

    ### Review Details:
    Rating: {review_rating} out of 5 stars
    Review Text: "{review_text}"

    ### Instructions for Reply:
    {sentiment_instruction}
    Do not use emojis unless the brand tone is explicitly 'witty' or 'casual'.
    Do not sound robotic or generic. Make it sound like a real person wrote it.

    ### Generated Reply:
    """
    return prompt

# --- Webhook Endpoint for Incoming Reviews (Simulated Shopify/Amazon/eBay Webhook) ---
@app.route('/webhook/new-review', methods=['POST'])
@app.route('/webhook/review', methods=['POST'])  # Alternative endpoint for dashboard
def handle_new_review_webhook():
    """
    Handle incoming review webhooks from e-commerce platforms
    Supports Shopify, Amazon, eBay review notifications
    """
    data = request.json
    print(f"Received webhook data: {json.dumps(data, indent=2)}")
    
    # --- TODO: Implement webhook signature verification for security! ---
    # Shopify webhooks come with an 'X-Shopify-Hmac-SHA256' header.
    # You MUST verify this to ensure the request is truly from Shopify and not malicious.
    webhook_signature = request.headers.get('X-Shopify-Hmac-SHA256')
    webhook_secret = os.environ.get('SHOPIFY_WEBHOOK_SECRET')
    
    # Uncomment for production use:
    # if webhook_secret and not verify_webhook_signature(request.data, webhook_signature, webhook_secret):
    #     return jsonify({"message": "Unauthorized webhook"}), 401
    
    # Extract review data (this structure varies by platform and review app)
    # For Shopify, product reviews are often handled by specific apps.
    # This is a simplified example. You'd adapt this to the actual webhook payload.
    review_id = data.get('id', f"review_{int(datetime.now().timestamp())}")
    product_id = data.get('product_id', 'prod_default')
    review_text = data.get('body') or data.get('review_text')
    review_rating = data.get('rating') or data.get('review_rating')  # Assuming a numerical rating
    reviewer_name = data.get('reviewer', {}).get('name') if isinstance(data.get('reviewer'), dict) else data.get('reviewer_name') or data.get('customer_name') or 'Valued Customer'
    
    if not review_id or not review_text or review_rating is None:
        return jsonify({"message": "Invalid review data received"}), 400
    
    # --- TODO: Fetch user's specific brand tone and niche from your database based on store_id/user_id ---
    # For this demo, let's assume a fixed user_id and niche
    user_id = "user123"  # In production, this would be tied to the Shopify shop's ID
    niche_context = "handmade jewelry"  # This would be configured by the user
    
    brand_tone_config = get_user_brand_tone(user_id)
    
    # --- Generate AI Reply (Ideally in a background task) ---
    try:
        prompt = generate_review_reply_prompt(review_text, review_rating, brand_tone_config, niche_context)
        print(f"Sending prompt to OpenAI:\n{prompt}")
        
        # Using Chat Completions API which is recommended
        # model = "gpt-3.5-turbo" or "gpt-4o" for better quality
        chat_completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",  # Use a more capable model like "gpt-4o" for better quality
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,  # Controls randomness. Lower for more predictable, higher for more creative.
            max_tokens=150  # Limit reply length
        )
        ai_generated_reply = chat_completion.choices[0].message.content.strip()
        print(f"AI Generated Reply:\n{ai_generated_reply}")
        
        # Save the original review, AI-generated reply, and status ('pending_approval') to storage
        review_obj = {
            "id": review_id,
            "product_id": product_id,
            "reviewer_name": reviewer_name,
            "review_text": review_text,
            "review_rating": review_rating,
            "ai_draft": ai_generated_reply,
            "status": "pending_approval",
            "user_id": user_id,
            "niche_context": niche_context
        }
        add_review(review_obj)
        
        # In a real app, this would return a confirmation that the draft was created
        return jsonify({"message": "Review received, AI draft generated and awaiting approval.", "ai_reply_draft": ai_generated_reply}), 200
        
    except openai.APIError as e:
        print(f"OpenAI API error: {e}")
        return jsonify({"message": f"Error generating reply: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"message": f"An internal server error occurred: {e}"}), 500

@app.route('/api/reviews/pending', methods=['GET'])
@app.route('/reviews', methods=['GET'])  # Alternative endpoint for dashboard
def get_pending_reviews():
    reviews = load_reviews()
    pending = [r for r in reviews if r.get("status") == "pending_approval"]
    return jsonify(pending), 200

@app.route('/api/reviews/all', methods=['GET'])
def get_all_reviews():
    reviews = load_reviews()
    return jsonify(reviews), 200

@app.route('/api/analytics/dashboard', methods=['GET'])
@app.route('/analytics', methods=['GET'])  # Alternative endpoint for dashboard
def get_dashboard_analytics():
    reviews = load_reviews()
    total_reviews = len(reviews)
    pending_reviews = len([r for r in reviews if r.get("status") == "pending_approval"])
    published_reviews = len([r for r in reviews if r.get("status") == "published"])
    
    # Calculate average rating
    ratings = [r.get("review_rating", 0) for r in reviews if r.get("review_rating")]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    
    # Rating distribution
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        if rating in rating_dist:
            rating_dist[rating] += 1
    
    analytics = {
        "total_reviews": total_reviews,
        "pending_reviews": pending_reviews,
        "published_reviews": published_reviews,
        "average_rating": round(avg_rating, 2),
        "rating_distribution": rating_dist,
        "response_rate": round((published_reviews / total_reviews * 100) if total_reviews > 0 else 0, 1)
    }
    
    return jsonify(analytics), 200

@app.route('/api/brand-settings', methods=['GET'])
@app.route('/brand-settings', methods=['GET'])  # Alternative endpoint for dashboard
def get_brand_settings():
    # In a real app, this would be user-specific
    return jsonify(get_user_brand_tone("user123")), 200

@app.route('/api/brand-settings', methods=['POST'])
@app.route('/brand-settings', methods=['POST'])  # Alternative endpoint for dashboard
def update_brand_settings():
    # In a real app, this would update user-specific settings
    data = request.json
    # For MVP, we'll just return success
    return jsonify({"message": "Brand settings updated successfully"}), 200

# --- Endpoint for Publishing Approved Reply (Your Frontend Calls This) ---
@app.route('/publish-reply', methods=['POST'])
@app.route('/reviews/<review_id>/approve', methods=['POST'])  # RESTful endpoint for dashboard
def publish_reply(review_id=None):
    """
    Publish approved reply to the e-commerce platform
    This endpoint is called by the frontend after user approval
    """
    data = request.json or {}
    review_id = review_id or data.get('review_id')
    approved_reply = data.get('approved_reply') or data.get('response')
    # shop_id = data.get('shop_id')  # Identify which Shopify store this is for
    
    if not review_id or not approved_reply:
        return jsonify({"message": "Missing review_id or approved_reply"}), 400
    
    # --- TODO: Authenticate user request and ensure they own the review ---
    # For demo, assume valid
    # user_id = get_current_user_id()  # From your authentication system
    # if not user_owns_review(user_id, review_id): return 403
    
    # --- TODO: Call Shopify/Amazon/eBay API to post the reply ---
    # This is the trickiest part for Shopify. You need to use their GraphQL Admin API
    # with the correct access token and permissions to update a `ProductReview` metaobject
    # or interact with a third-party review app's API.
    
    # Example (highly simplified, assumes direct Shopify API for product reviews which is complex):
    # shopify_api_url = f"https://your-shop-name.myshopify.com/admin/api/2024-07/graphql.json"
    # headers = {
    #     "X-Shopify-Access-Token": "YOUR_SHOPIFY_ACCESS_TOKEN",  # Per store
    #     "Content-Type": "application/json"
    # }
    # payload = {
    #     "query": """
    #     mutation productReviewUpdate($id: ID!, $reply: String!) {
    #         productReviewUpdate(id: $id, input: {reply: $reply}) {
    #             userErrors { field message }
    #             productReview { id reply }
    #         }
    #     }
    #     """,
    #     "variables": {
    #         "id": f"gid://shopify/ProductReview/{review_id}",  # Shopify GID
    #         "reply": approved_reply
    #     }
    # }
    # 
    # response = requests.post(shopify_api_url, headers=headers, json=payload)
    # 
    # if response.status_code == 200:
    #     # Check response.json() for success/errors from Shopify
    #     update_review_status(review_id, "published", published_reply=approved_reply)
    #     return jsonify({"message": "Reply published successfully!", "review_id": review_id}), 200
    # else:
    #     print(f"Failed to publish to Shopify: {response.text}")
    #     return jsonify({"message": "Failed to publish reply to Shopify", "error": response.text}), 500
    
    # For demo, simulate success:
    print(f"Simulating publishing reply for review {review_id}: {approved_reply}")
    # Simulate publishing (In a real app, you would change the status in your DB to 'published')
    update_review_status(review_id, "published", published_reply=approved_reply)
    return jsonify({"message": "Reply published successfully (simulated)!", "review_id": review_id}), 200

@app.route('/reviews/<review_id>/reject', methods=['POST'])
def reject_review(review_id):
    """
    Reject a review response (mark as rejected)
    """
    try:
        update_review_status(review_id, "rejected")
        return jsonify({"message": "Review rejected successfully", "review_id": review_id}), 200
    except Exception as e:
        return jsonify({"message": f"Failed to reject review: {e}"}), 500

if __name__ == '__main__':
    # For local development, run with `python app.py`
    # In production, use a WSGI server like Gunicorn
    print("Starting AI Review Response Automation Platform...")
    print("Backend server running on http://localhost:5000")
    print("Webhook endpoint: http://localhost:5000/webhook/new-review")
    app.run(debug=True, port=5000)
