from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import time
from threading import Lock
from datetime import datetime
from dotenv import load_dotenv
import hashlib
import hmac

# Import our AES encryption utilities
from encryption_utils import AESEncryption, encrypt_json, decrypt_json, generate_secure_key

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize AES encryption
# In production, use a secure environment variable for ENCRYPTION_KEY
encryption = AESEncryption()

# Simple file-based storage for MVP
REVIEW_DB_FILE = "reviews_db.json"
ENCRYPTED_DATA_FILE = "encrypted_data.json"
db_lock = Lock()

def load_reviews():
    if not os.path.exists(REVIEW_DB_FILE):
        return []
    with db_lock, open(REVIEW_DB_FILE, "r") as f:
        return json.load(f)

def save_reviews(reviews):
    with db_lock, open(REVIEW_DB_FILE, "w") as f:
        json.dump(reviews, f, indent=2)

def load_encrypted_data():
    """Load encrypted data from file"""
    if not os.path.exists(ENCRYPTED_DATA_FILE):
        return {"users": {}, "brand_settings": {}, "api_keys": {}, "encrypted_profiles": {}}
    with db_lock, open(ENCRYPTED_DATA_FILE, "r") as f:
        return json.load(f)

def save_encrypted_data(data):
    """Save encrypted data to file"""
    with db_lock, open(ENCRYPTED_DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def encrypt_and_store_user_data(user_id, data_type, data):
    """Encrypt and store sensitive user data"""
    try:
        encrypted_store = load_encrypted_data()
        
        if user_id not in encrypted_store:
            encrypted_store[user_id] = {}
        
        # Encrypt the sensitive data
        encrypted_data = encryption.encrypt_data(data)
        encrypted_store[user_id][data_type] = {
            "encrypted_data": encrypted_data,
            "updated_at": datetime.now().isoformat()
        }
        
        save_encrypted_data(encrypted_store)
        return True
    except Exception as e:
        print(f"Encryption error: {e}")
        return False

def decrypt_and_retrieve_user_data(user_id, data_type):
    """Decrypt and retrieve sensitive user data"""
    try:
        encrypted_store = load_encrypted_data()
        
        if user_id not in encrypted_store or data_type not in encrypted_store[user_id]:
            return None
        
        encrypted_data = encrypted_store[user_id][data_type]["encrypted_data"]
        decrypted_data = encryption.decrypt_data(encrypted_data)
        return decrypted_data
    except Exception as e:
        print(f"Decryption error: {e}")
        return None

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

def analyze_review_sentiment_advanced(review_text, rating):
    """
    Advanced sentiment analysis beyond just rating numbers
    """
    review_lower = review_text.lower()
    
    # Positive indicators
    positive_words = ['love', 'amazing', 'perfect', 'excellent', 'fantastic', 'beautiful', 'gorgeous', 
                     'stunning', 'recommend', 'wonderful', 'brilliant', 'outstanding', 'impressed']
    
    # Negative indicators
    negative_words = ['terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting', 'useless',
                     'broken', 'damaged', 'disappointed', 'refund', 'return', 'waste']
    
    # Issue-specific indicators
    shipping_issues = ['late', 'slow', 'delayed', 'shipping', 'delivery', 'arrived']
    quality_issues = ['cheap', 'flimsy', 'poor quality', 'broke', 'defective', 'faulty']
    size_issues = ['too small', 'too big', 'wrong size', 'doesn\'t fit', 'sizing']
    
    sentiment = {
        'overall': 'neutral',
        'specific_issues': [],
        'positive_aspects': [],
        'emotion_level': 'moderate'
    }
    
    # Determine overall sentiment
    if rating >= 4 or any(word in review_lower for word in positive_words):
        sentiment['overall'] = 'positive'
    elif rating <= 2 or any(word in review_lower for word in negative_words):
        sentiment['overall'] = 'negative'
    
    # Identify specific issues
    if any(word in review_lower for word in shipping_issues):
        sentiment['specific_issues'].append('shipping')
    if any(word in review_lower for word in quality_issues):
        sentiment['specific_issues'].append('quality')
    if any(word in review_lower for word in size_issues):
        sentiment['specific_issues'].append('sizing')
    
    # Determine emotion level
    if any(word in review_lower for word in ['love', 'hate', 'amazing', 'terrible']):
        sentiment['emotion_level'] = 'high'
    
    return sentiment

def get_niche_specific_context(niche_context):
    """
    Returns niche-specific response strategies and vocabulary
    """
    niche_contexts = {
        'handmade jewelry': {
            'craftsmanship_terms': ['handcrafted', 'artisan-made', 'carefully crafted', 'unique piece'],
            'quality_assurance': 'Each piece is individually inspected for quality',
            'personalization': 'We can customize pieces to your preferences',
            'common_concerns': ['tarnishing', 'sizing', 'delicate handling'],
            'brand_values': ['authenticity', 'craftsmanship', 'uniqueness']
        },
        'clothing': {
            'craftsmanship_terms': ['quality fabrics', 'attention to detail', 'carefully designed'],
            'quality_assurance': 'All garments undergo quality checks',
            'personalization': 'We offer size exchanges and alterations',
            'common_concerns': ['sizing', 'fabric quality', 'color accuracy'],
            'brand_values': ['style', 'comfort', 'quality']
        },
        'electronics': {
            'craftsmanship_terms': ['precision engineering', 'quality components', 'rigorous testing'],
            'quality_assurance': 'All products are tested before shipping',
            'personalization': 'We provide technical support and warranty',
            'common_concerns': ['functionality', 'durability', 'compatibility'],
            'brand_values': ['innovation', 'reliability', 'performance']
        },
        'home decor': {
            'craftsmanship_terms': ['thoughtfully designed', 'quality materials', 'attention to detail'],
            'quality_assurance': 'Each item is carefully packaged to prevent damage',
            'personalization': 'We can help you find the perfect piece for your space',
            'common_concerns': ['shipping damage', 'color matching', 'size'],
            'brand_values': ['style', 'quality', 'home beautification']
        },
        'beauty': {
            'craftsmanship_terms': ['carefully formulated', 'premium ingredients', 'tested formulas'],
            'quality_assurance': 'All products are dermatologist tested',
            'personalization': 'We can recommend products for your skin type',
            'common_concerns': ['skin reactions', 'effectiveness', 'ingredient quality'],
            'brand_values': ['beauty', 'self-care', 'confidence']
        }
    }
    
    return niche_contexts.get(niche_context, niche_contexts['handmade jewelry'])

def generate_review_reply_prompt(review_text, review_rating, brand_tone_config, niche_context):
    """
    ADVANCED PROMPT ENGINEERING - The Secret Sauce
    This function uses sophisticated prompt engineering techniques to generate
    contextually aware, emotionally intelligent, and brand-consistent responses.
    """
    
    # Advanced sentiment analysis
    sentiment = analyze_review_sentiment_advanced(review_text, review_rating)
    niche_info = get_niche_specific_context(niche_context)
    
    # Extract brand configuration
    tone = brand_tone_config.get("tone", "friendly and professional")
    key_phrases = brand_tone_config.get("key_phrases", [])
    
    # Advanced tone mapping
    tone_instructions = {
        'friendly': 'Warm, approachable, and personable. Use conversational language.',
        'professional': 'Polished, business-appropriate, and competent.',
        'casual': 'Relaxed, informal, and conversational. You may use contractions.',
        'luxury': 'Sophisticated, elegant, and premium. Emphasize exclusivity.',
        'witty': 'Clever and humorous while remaining respectful.',
        'artisanal': 'Emphasize craftsmanship, tradition, and personal touch.',
        'technical': 'Precise, informative, and solution-focused.'
    }
    
    # Build dynamic response strategy based on sentiment analysis
    if sentiment['overall'] == 'positive':
        if sentiment['emotion_level'] == 'high':
            response_strategy = """
            STRATEGY: High-energy positive response
            - Match their enthusiasm with genuine excitement
            - Highlight what makes your product special
            - Invite them to share their experience (photos, social media)
            - Reinforce brand values and community
            """
        else:
            response_strategy = """
            STRATEGY: Warm appreciation response
            - Express sincere gratitude
            - Reinforce their good choice
            - Gently encourage future purchases or recommendations
            """
    
    elif sentiment['overall'] == 'negative':
        if sentiment['specific_issues']:
            issue_solutions = {
                'shipping': 'Acknowledge shipping concern, explain improvements, offer expedited future shipping',
                'quality': 'Apologize for quality issue, explain quality standards, offer replacement/refund',
                'sizing': 'Acknowledge sizing concern, offer exchange, provide better sizing guidance'
            }
            solutions = [issue_solutions.get(issue, '') for issue in sentiment['specific_issues']]
            specific_issues_text = ', '.join(sentiment['specific_issues'])
            solutions_text = '. '.join(solutions)
            response_strategy = """
            STRATEGY: Problem-solving response
            - Apologize sincerely without being defensive
            - Address specific issues: """ + specific_issues_text + """
            - Provide concrete solutions: """ + solutions_text + """
            - Demonstrate commitment to customer satisfaction
            """
        else:
            response_strategy = """
            STRATEGY: Empathetic recovery response
            - Acknowledge their disappointment with genuine empathy
            - Take responsibility without making excuses
            - Offer specific remediation (refund, replacement, store credit)
            - Invite private conversation to resolve
            """
    
    else:  # neutral
        response_strategy = """
        STRATEGY: Engagement and improvement response
        - Thank them for honest feedback
        - Address any specific points they raised
        - Show how you're using feedback to improve
        - Invite future engagement
        """
    
    # Construct the advanced prompt
    brand_values_text = ', '.join(niche_info['brand_values'])
    tone_guideline = tone_instructions.get(tone, 'Professional and helpful')
    key_phrases_text = ', '.join(key_phrases) if key_phrases else 'None specified'
    specific_issues_text = ', '.join(sentiment['specific_issues']) if sentiment['specific_issues'] else 'None'
    
    prompt = """You are an expert customer service representative for a {} business. You have years of experience in customer relations and understand the nuances of online review responses.

BUSINESS CONTEXT:
- Industry: {}
- Brand Values: {}
- Quality Promise: {}

BRAND VOICE:
- Primary Tone: {}
- Tone Guidelines: {}
- Key Brand Phrases to weave in naturally: {}

CUSTOMER REVIEW ANALYSIS:
- Rating: {}/5 stars
- Review Text: "{}"
- Detected Sentiment: {} (emotion level: {})
- Specific Issues Identified: {}

{}

RESPONSE REQUIREMENTS:
1. Length: 2-4 sentences (conversational, not essay-like)
2. Authenticity: Sound like a real person, not a bot
3. Specificity: Reference specific details from their review
4. Brand Consistency: Reflect the brand voice and values
5. Action-Oriented: Include next steps when appropriate
6. Emotional Intelligence: Match the emotional tone appropriately

AVOID:
- Generic templates that could apply to any business
- Over-apologizing or being defensive
- Mentioning competitors
- Making promises you can't keep
- Using corporate jargon or buzzwords
- Emojis (unless brand tone is explicitly casual/witty)

Write a response that feels personal, genuine, and professionally crafted:""".format(
        niche_context,
        niche_context,
        brand_values_text,
        niche_info['quality_assurance'],
        tone,
        tone_guideline,
        key_phrases_text,
        review_rating,
        review_text,
        sentiment['overall'],
        sentiment['emotion_level'],
        specific_issues_text,
        response_strategy
    )

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
    print("Received webhook data: " + json.dumps(data, indent=2))
    
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
    review_id = data.get('id', "review_" + str(int(datetime.now().timestamp())))
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
    
    # --- Generate Demo Reply ---
    try:
        prompt = generate_review_reply_prompt(review_text, review_rating, brand_tone_config, niche_context)
        print("Generated prompt for demo response:\n" + prompt)
        
        # Generate demo response based on rating
        print("Using demo response generation (OpenAI removed)")
        if int(review_rating) >= 4:
            ai_generated_reply = "Thank you so much for the wonderful " + str(review_rating) + "-star review! We're thrilled to hear you enjoyed your experience. Your feedback means the world to us and motivates our team to continue delivering quality products. We'd love to serve you again soon!"
        elif int(review_rating) == 3:
            ai_generated_reply = "Thank you for your honest " + str(review_rating) + "-star feedback! We appreciate you taking the time to share your experience. We're always working to improve, and your input helps us do better. If there's anything specific we can address, please don't hesitate to reach out."
        else:
            ai_generated_reply = "Thank you for your " + str(review_rating) + "-star review and for bringing your concerns to our attention. We sincerely apologize that your experience didn't meet expectations. We'd love the opportunity to make this right - please contact us directly so we can resolve this issue promptly."
        print("Demo Generated Reply:\n" + ai_generated_reply)
        
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
        return jsonify({
            "message": "Review received, demo response generated and awaiting approval.", 
            "ai_reply_draft": ai_generated_reply,
            "ai_response": ai_generated_reply,  # For test interface compatibility
            "review_id": review_id,
            "demo_mode": True
        }), 200
        
    except Exception as e:
        print("An unexpected error occurred: " + str(e))
        return jsonify({"message": "An internal server error occurred: " + str(e)}), 500

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
    user_id = request.headers.get('X-User-ID', 'demo_user')  # In production, get from auth token
    
    # Try to get encrypted brand settings
    brand_settings = decrypt_and_retrieve_user_data(user_id, 'brand_settings')
    
    if not brand_settings:
        # Return default settings if none exist
        brand_settings = get_user_brand_tone(user_id)
    
    return jsonify(brand_settings), 200

@app.route('/api/brand-settings', methods=['POST'])
@app.route('/brand-settings', methods=['POST'])  # Alternative endpoint for dashboard
def update_brand_settings():
    user_id = request.headers.get('X-User-ID', 'demo_user')  # In production, get from auth token
    data = request.json
    
    # Encrypt and store the brand settings
    success = encrypt_and_store_user_data(user_id, 'brand_settings', data)
    
    if success:
        return jsonify({"message": "Brand settings updated successfully", "encrypted": True}), 200
    else:
        return jsonify({"error": "Failed to save brand settings"}), 500

@app.route('/api/profile', methods=['GET'])
def get_profile():
    user_id = request.headers.get('X-User-ID', 'demo_user')
    
    # Try to get encrypted profile
    profile = decrypt_and_retrieve_user_data(user_id, 'profile')
    
    if not profile:
        # Return mock profile if none exists
        profile = {
            "name": "John Doe",
            "email": "john@example.com", 
            "company": "Acme Corp",
            "phone": "+1 (555) 123-4567",
            "created_at": "2025-01-15",
            "plan": "Pro"
        }
    
    return jsonify(profile), 200

@app.route('/api/profile', methods=['POST'])
def update_profile():
    user_id = request.headers.get('X-User-ID', 'demo_user')
    data = request.json
    
    # Filter out sensitive data that shouldn't be stored
    safe_profile_data = {
        "name": data.get("name"),
        "email": data.get("email"),
        "company": data.get("company"),
        "phone": data.get("phone"),
        "updated_at": datetime.now().isoformat()
    }
    
    # Encrypt and store the profile
    success = encrypt_and_store_user_data(user_id, 'profile', safe_profile_data)
    
    if success:
        return jsonify({"message": "Profile updated successfully", "encrypted": True}), 200
    else:
        return jsonify({"error": "Failed to save profile"}), 500
    data = request.json
    # In a real app, this would update user profile in database
    # For MVP, we'll just return success
    return jsonify({"message": "Profile updated successfully"}), 200

@app.route('/api/settings', methods=['GET'])
def get_settings():
    user_id = request.headers.get('X-User-ID', 'demo_user')
    
    # Try to get encrypted settings
    settings = decrypt_and_retrieve_user_data(user_id, 'settings')
    
    if not settings:
        # Return default settings if none exist
        settings = {
            "emailNotifications": True,
            "reviewAlerts": True,
            "weeklySummary": False,
            "darkMode": False,
            "compactView": False,
            "autoApproveThreshold": "95% confidence"
        }
    
    return jsonify(settings), 200

@app.route('/api/settings', methods=['POST'])
def update_settings():
    user_id = request.headers.get('X-User-ID', 'demo_user')
    data = request.json
    
    # Encrypt and store the settings
    success = encrypt_and_store_user_data(user_id, 'settings', data)
    
    if success:
        return jsonify({"message": "Settings updated successfully", "encrypted": True}), 200
    else:
        return jsonify({"error": "Failed to save settings"}), 500

# New encrypted API key management endpoints
@app.route('/api/keys', methods=['GET'])
def get_api_keys():
    """Get masked API keys for display"""
    user_id = request.headers.get('X-User-ID', 'demo_user')
    
    # Decrypt API keys
    api_keys = decrypt_and_retrieve_user_data(user_id, 'api_keys')
    
    if not api_keys:
        return jsonify({"keys": []}), 200
    
    # Mask sensitive keys for display
    masked_keys = {}
    for service, key_data in api_keys.items():
        if isinstance(key_data, dict) and 'key' in key_data:
            key = key_data['key']
            masked_key = key[:8] + '*' * (len(key) - 12) + key[-4:] if len(key) > 12 else '*' * len(key)
            masked_keys[service] = {
                "masked_key": masked_key,
                "created_at": key_data.get('created_at'),
                "last_used": key_data.get('last_used'),
                "status": "active"
            }
    
    return jsonify({"keys": masked_keys}), 200

@app.route('/api/keys', methods=['POST'])
def store_api_key():
    """Store encrypted API key"""
    user_id = request.headers.get('X-User-ID', 'demo_user')
    data = request.json
    
    service = data.get('service')  # e.g., 'openai', 'stripe', 'shopify'
    api_key = data.get('api_key')
    
    if not service or not api_key:
        return jsonify({"error": "Service and API key are required"}), 400
    
    # Get existing keys
    api_keys = decrypt_and_retrieve_user_data(user_id, 'api_keys') or {}
    
    # Add new key with metadata
    api_keys[service] = {
        "key": api_key,
        "created_at": datetime.now().isoformat(),
        "last_used": None
    }
    
    # Encrypt and store
    success = encrypt_and_store_user_data(user_id, 'api_keys', api_keys)
    
    if success:
        return jsonify({"message": f"{service} API key stored securely", "encrypted": True}), 200
    else:
        return jsonify({"error": "Failed to store API key"}), 500

@app.route('/api/keys/<service>', methods=['DELETE'])
def delete_api_key(service):
    """Delete an encrypted API key"""
    user_id = request.headers.get('X-User-ID', 'demo_user')
    
    # Get existing keys
    api_keys = decrypt_and_retrieve_user_data(user_id, 'api_keys') or {}
    
    if service in api_keys:
        del api_keys[service]
        
        # Re-encrypt and store
        success = encrypt_and_store_user_data(user_id, 'api_keys', api_keys)
        
        if success:
            return jsonify({"message": f"{service} API key deleted"}), 200
        else:
            return jsonify({"error": "Failed to delete API key"}), 500
    else:
        return jsonify({"error": "API key not found"}), 404

def get_user_api_key(user_id, service):
    """Helper function to get decrypted API key for internal use"""
    api_keys = decrypt_and_retrieve_user_data(user_id, 'api_keys')
    if api_keys and service in api_keys:
        # Update last used timestamp
        api_keys[service]['last_used'] = datetime.now().isoformat()
        encrypt_and_store_user_data(user_id, 'api_keys', api_keys)
        return api_keys[service]['key']
    return None

@app.route('/api/billing', methods=['GET'])
def get_billing():
    # Mock billing data for demo
    billing = {
        "plan": "Pro",
        "price": 29,
        "currency": "USD",
        "billing_period": "monthly",
        "responses_used": 247,
        "responses_limit": 1000,
        "next_billing_date": "2025-08-23",
        "payment_method": {
            "type": "card",
            "brand": "visa",
            "last4": "4242"
        },
        "usage_percentage": 25
    }
    return jsonify(billing), 200

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
    print("Simulating publishing reply for review " + review_id + ": " + approved_reply)
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
        return jsonify({"message": "Failed to reject review: " + str(e)}), 500

@app.route('/api/reviews/simulate', methods=['POST'])
def simulate_review():
    """
    Generate a random sample review with real AI response for testing and demo purposes
    """
    import uuid
    import random
    
    sample_reviews = [
        {
            "review_text": "Amazing product! The quality exceeded my expectations and the shipping was incredibly fast. The customer service team was also very helpful when I had questions about sizing. Definitely ordering again!",
            "reviewer_name": "Sarah Johnson",
            "rating": 5,
            "platform": "Shopify"
        },
        {
            "review_text": "The product was okay but not quite what I expected from the photos. The color was slightly different and the material felt a bit cheap. However, it arrived on time and packaging was good.",
            "reviewer_name": "Mike Chen", 
            "rating": 3,
            "platform": "Amazon"
        },
        {
            "review_text": "Excellent customer service! I had an issue with my order and they resolved it immediately. The replacement product was perfect and arrived within 24 hours. Very impressed with this company!",
            "reviewer_name": "Emily Rodriguez",
            "rating": 5,
            "platform": "WooCommerce"
        },
        {
            "review_text": "Product arrived damaged unfortunately. The box was clearly mishandled during shipping. However, I contacted support and they're sending a replacement right away. Will update my review once I receive it.",
            "reviewer_name": "David Kim",
            "rating": 2,
            "platform": "Etsy"
        },
        {
            "review_text": "Perfect fit and exactly as described! The quality is outstanding and the price point is very reasonable. I've already recommended this to several friends. Fast shipping and great packaging too.",
            "reviewer_name": "Jessica Taylor",
            "rating": 5,
            "platform": "Shopify"
        },
        {
            "review_text": "The item looks nice but the instructions were unclear and some parts were missing. Had to contact customer support twice to get the missing pieces. Product itself is good once assembled.",
            "reviewer_name": "Robert Wilson",
            "rating": 3,
            "platform": "Amazon"
        },
        {
            "review_text": "This is my third purchase from this store and they never disappoint! The attention to detail is incredible and the handcrafted quality really shows. Worth every penny!",
            "reviewer_name": "Maria Garcia",
            "rating": 5,
            "platform": "Etsy"
        }
    ]
    
    try:
        # Select a random review
        sample = random.choice(sample_reviews)
        
        # Get brand settings (encrypted if available)
        user_id = request.headers.get('X-User-ID', 'demo_user')
        brand_settings = decrypt_and_retrieve_user_data(user_id, 'brand_settings')
        if not brand_settings:
            brand_settings = get_user_brand_tone(user_id)
        
        # Detect language (for future multilingual support)
        detected_language = ai_service.detect_language(sample["review_text"])
        
        # Generate AI response using advanced service
        print(f"🤖 Generating AI response for {sample['rating']}-star review...")
        ai_result = ai_service.generate_ai_response(
            sample["review_text"], 
            sample["rating"], 
            brand_settings,
            detected_language
        )
        
        # Perform sentiment analysis
        sentiment_analysis = ai_service.analyze_sentiment_advanced(sample["review_text"])
        
        # Create review object with advanced AI features
        review = {
            "id": str(uuid.uuid4()),
            "review_text": sample["review_text"],
            "reviewer_name": sample["reviewer_name"],
            "rating": sample["rating"],
            "platform": sample["platform"],
            "status": "pending_approval",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "confidence_score": ai_result["confidence_score"],
            "ai_response": ai_result["response"],
            "language": ai_result["language"],
            "personalized": ai_result["personalized"],
            "ai_generated": ai_result["ai_generated"],
            "sentiment_analysis": sentiment_analysis
        }
        
        # Add to reviews database
        add_review(review)
        
        # Generate insights if enough reviews
        all_reviews = load_reviews()
        insights = {}
        if len(all_reviews) >= 3:
            insights = ai_service.generate_predictive_insights(all_reviews[-10:])  # Last 10 reviews
        
        return jsonify({
            "message": "AI-powered review response generated successfully!",
            "review": review,
            "insights": insights,
            "ai_powered": True,
            "features_used": ["sentiment_analysis", "personalized_response", "language_detection"]
        }), 200
        
    except Exception as e:
        print(f"Error in simulate_review: {e}")
        return jsonify({"message": "Failed to generate sample review: " + str(e)}), 500

# --- HEALTH CHECK AND STATIC FILE ENDPOINTS ---

@app.route('/')
def index():
    """Serve the elite dashboard as the main interface"""
    try:
        return send_from_directory('.', 'elite-dashboard.html')
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to serve dashboard: {str(e)}",
            "available_endpoints": ["/health", "/api/status", "/dashboard.html"]
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint for Google Cloud Run"""
    return jsonify({
        "status": "healthy",
        "service": "AI Review Response Platform",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }), 200

@app.route('/api/status')
def api_status():
    """API status endpoint"""
    try:
        # Test basic functionality
        reviews = load_reviews()
        return jsonify({
            "status": "operational",
            "service": "AI Review Response Platform",
            "features": {
                "encryption": "enabled",
                "demo_mode": True,
                "ai_powered": False
            },
            "total_reviews": len(reviews),
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/dashboard.html')
def dashboard():
    """Serve the dashboard page"""
    return send_from_directory('.', 'dashboard.html')

@app.route('/prompt-lab.html')
def prompt_lab():
    """Serve the prompt lab page"""
    return send_from_directory('.', 'prompt-lab.html')

@app.route('/minimal-dashboard.html')
def minimal_dashboard():
    """Serve the minimal dashboard page"""
    return send_from_directory('.', 'minimal-dashboard.html')

@app.route('/elite-dashboard.html')
def elite_dashboard():
    """Serve the elite dashboard page"""
    return send_from_directory('.', 'elite-dashboard.html')

@app.route('/sentient-ai-lab.html')
def sentient_ai_lab():
    """Serve the Sentient AI Laboratory page"""
    return send_from_directory('.', 'sentient-ai-lab.html')

@app.route('/dashboard-elite.html')
def dashboard_elite():
    """Serve the elite dashboard page"""
    return send_from_directory('.', 'dashboard-elite.html')

@app.route('/index-elite.html')
def index_elite():
    """Serve the elite index page"""
    return send_from_directory('.', 'index-elite.html')

# Serve CSS and JS files
@app.route('/elite-theme.css')
def elite_theme_css():
    """Serve the elite theme CSS"""
    return send_from_directory('.', 'elite-theme.css')

@app.route('/elite-theme-controller.js')
def elite_theme_controller_js():
    """Serve the elite theme controller JS"""
    return send_from_directory('.', 'elite-theme-controller.js')

@app.route('/sentient-ai.css')
def sentient_ai_css():
    """Serve the sentient AI CSS"""
    return send_from_directory('.', 'sentient-ai.css')

@app.route('/sentient-ai-controller.js')
def sentient_ai_controller_js():
    """Serve the sentient AI controller JS"""
    return send_from_directory('.', 'sentient-ai-controller.js')

# Encryption management endpoints
@app.route('/api/encryption/status', methods=['GET'])
def encryption_status():
    """Get encryption system status"""
    try:
        # Test encryption/decryption
        test_data = {"timestamp": datetime.now().isoformat(), "test": True}
        encrypted = encryption.encrypt_data(test_data)
        decrypted = encryption.decrypt_data(encrypted)
        
        # Count encrypted records
        encrypted_store = load_encrypted_data()
        user_count = len(encrypted_store.get('users', {}))
        
        return jsonify({
            "status": "operational",
            "algorithm": "AES-256-GCM",
            "key_derivation": "PBKDF2-SHA256",
            "iterations": 100000,
            "test_passed": decrypted == test_data,
            "encrypted_users": user_count,
            "features": [
                "Profile encryption",
                "API key encryption", 
                "Settings encryption",
                "Brand voice encryption"
            ]
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@app.route('/api/encryption/generate-key', methods=['POST'])
def generate_new_key():
    """Generate a new secure encryption key (admin only in production)"""
    # In production, this should require admin authentication
    new_key = generate_secure_key()
    
    return jsonify({
        "message": "New encryption key generated",
        "key": new_key,
        "note": "Store this key securely as ENCRYPTION_KEY environment variable"
    }), 200

# Demo AI Endpoints (OpenAI removed due to billing)
@app.route('/api/ai/insights', methods=['GET'])
def get_ai_insights():
    """Get demo analytics insights"""
    try:
        reviews = load_reviews()
        
        # Demo insights
        demo_insights = {
            "trends": {
                "sentiment_trend": "improving",
                "response_time_trend": "faster",
                "customer_satisfaction": "86%"
            },
            "predictions": {
                "next_week_volume": len(reviews) + 5,
                "satisfaction_forecast": "positive",
                "areas_to_watch": ["shipping", "product quality"]
            },
            "recommendations": [
                "Focus on positive shipping experience messaging",
                "Highlight product quality in responses",
                "Maintain quick response times"
            ]
        }
        
        return jsonify({
            "insights": demo_insights,
            "total_reviews_analyzed": len(reviews),
            "ai_powered": False,
            "demo_mode": True
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate insights: {str(e)}"}), 500

@app.route('/api/ai/improvements', methods=['GET'])
def get_improvement_suggestions():
    """Get demo improvement suggestions"""
    try:
        reviews = load_reviews()
        
        # Demo suggestions
        demo_suggestions = {
            "product_improvements": [
                "Consider faster shipping options",
                "Improve packaging quality",
                "Add size guide for better fit"
            ],
            "service_improvements": [
                "Implement live chat support",
                "Create detailed FAQ section",
                "Offer proactive order updates"
            ],
            "response_improvements": [
                "Personalize responses more",
                "Address specific concerns mentioned",
                "Follow up on negative feedback"
            ]
        }
        
        return jsonify({
            "suggestions": demo_suggestions,
            "based_on_reviews": len(reviews),
            "ai_powered": False,
            "demo_mode": True
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate suggestions: {str(e)}"}), 500

@app.route('/api/ai/analyze-sentiment', methods=['POST'])
def analyze_review_sentiment():
    """Analyze sentiment with demo analysis"""
    data = request.json
    review_text = data.get('review_text', '')
    
    if not review_text:
        return jsonify({"error": "Review text is required"}), 400
    
    try:
        # Simple demo sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'best']
        negative_words = ['bad', 'terrible', 'awful', 'worst', 'hate', 'disappointed']
        
        text_lower = review_text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = "positive"
            confidence = 0.8
        elif negative_count > positive_count:
            sentiment = "negative"
            confidence = 0.8
        else:
            sentiment = "neutral"
            confidence = 0.6
        
        analysis = {
            "sentiment": sentiment,
            "confidence": confidence,
            "positive_indicators": positive_count,
            "negative_indicators": negative_count
        }
        
        return jsonify({
            "sentiment_analysis": analysis,
            "detected_language": "en",
            "ai_powered": False,
            "demo_mode": True
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to analyze sentiment: {str(e)}"}), 500

@app.route('/api/ai/generate-response', methods=['POST'])
def generate_ai_response():
    """Generate demo response for a specific review"""
    data = request.json
    review_text = data.get('review_text', '')
    rating = data.get('rating', 3)
    language = data.get('language', 'en')
    
    if not review_text:
        return jsonify({"error": "Review text is required"}), 400
    
    try:
        # Get user's brand settings
        user_id = request.headers.get('X-User-ID', 'demo_user')
        brand_settings = decrypt_and_retrieve_user_data(user_id, 'brand_settings')
        if not brand_settings:
            brand_settings = get_user_brand_tone(user_id)
        
        # Generate demo response based on rating
        if rating >= 4:
            demo_response = f"Thank you so much for your wonderful {rating}-star review! We're thrilled that you enjoyed your experience with us."
        elif rating == 3:
            demo_response = "Thank you for your feedback! We appreciate you taking the time to share your experience and are always working to improve."
        else:
            demo_response = f"Thank you for your {rating}-star review. We take all feedback seriously and would love to make this right. Please reach out to us directly."
        
        result = {
            "response": demo_response,
            "tone": brand_settings.get('tone', 'professional'),
            "confidence": 0.85,
            "sentiment": "positive" if rating >= 4 else "neutral" if rating == 3 else "negative"
        }
        
        return jsonify({
            "ai_response": result,
            "openai_available": False,
            "ai_powered": False,
            "demo_mode": True
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate response: {str(e)}"}), 500

@app.route('/api/ai/multilingual-response', methods=['POST'])
def generate_multilingual_response():
    """Generate demo response in multiple languages"""
    data = request.json
    review_text = data.get('review_text', '')
    rating = data.get('rating', 3)
    target_languages = data.get('languages', ['en'])
    
    if not review_text:
        return jsonify({"error": "Review text is required"}), 400
    
    try:
        user_id = request.headers.get('X-User-ID', 'demo_user')
        brand_settings = decrypt_and_retrieve_user_data(user_id, 'brand_settings')
        if not brand_settings:
            brand_settings = get_user_brand_tone(user_id)
        
        # Demo multilingual responses
        demo_responses = {
            'en': "Thank you for your review! We appreciate your feedback.",
            'es': "¡Gracias por tu reseña! Apreciamos tus comentarios.",
            'fr': "Merci pour votre avis! Nous apprécions vos commentaires.",
            'de': "Vielen Dank für Ihre Bewertung! Wir schätzen Ihr Feedback.",
            'it': "Grazie per la tua recensione! Apprezziamo il tuo feedback."
        }
        
        responses = {}
        for lang in target_languages:
            base_response = demo_responses.get(lang, demo_responses['en'])
            responses[lang] = {
                "response": base_response,
                "tone": brand_settings.get('tone', 'professional'),
                "confidence": 0.80,
                "language": lang
            }
        
        return jsonify({
            "multilingual_responses": responses,
            "supported_languages": list(demo_responses.keys()),
            "demo_mode": True,
            "ai_powered": False
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate multilingual responses: {str(e)}"}), 500

# --- PROMPT ENGINEERING TESTING ENDPOINTS ---

@app.route('/test-prompt', methods=['POST'])
def test_prompt_engineering():
    """
    Advanced prompt testing endpoint for iterating on AI responses
    """
    data = request.json
    
    # Test scenarios for different review types
    test_scenarios = data.get('scenarios', [
        {
            "name": "Glowing 5-star review",
            "review_text": "Absolutely love my new earrings! The craftsmanship is incredible and they arrived perfectly packaged. Will definitely order again!",
            "rating": 5,
            "customer_name": "Sarah M."
        },
        {
            "name": "Positive with minor issue",
            "review_text": "Beautiful necklace, exactly as pictured. Shipping took a bit longer than expected but worth the wait.",
            "rating": 4,
            "customer_name": "Jennifer L."
        },
        {
            "name": "Neutral feedback",
            "review_text": "The ring is nice but not quite what I expected from the photos. Quality is decent for the price.",
            "rating": 3,
            "customer_name": "Mike R."
        },
        {
            "name": "Negative with specific issues",
            "review_text": "Very disappointed. The bracelet broke after just two days of wearing. Poor quality materials.",
            "rating": 2,
            "customer_name": "Lisa K."
        },
        {
            "name": "Angry 1-star review",
            "review_text": "Terrible experience! Item never arrived and customer service is non-existent. Do not buy from this seller!",
            "rating": 1,
            "customer_name": "David P."
        }
    ])
    
    # Test different brand configurations
    brand_configs = data.get('brand_configs', [
        {
            "name": "Artisanal Friendly",
            "tone": "friendly, appreciative, artisanal",
            "key_phrases": ["handcrafted", "unique design", "artisan-made"],
            "niche": "handmade jewelry"
        },
        {
            "name": "Professional Luxury",
            "tone": "professional, luxury, sophisticated",
            "key_phrases": ["premium quality", "exceptional craftsmanship", "exclusive"],
            "niche": "handmade jewelry"
        },
        {
            "name": "Casual & Witty",
            "tone": "casual, witty, approachable",
            "key_phrases": ["handmade with love", "one-of-a-kind", "made just for you"],
            "niche": "handmade jewelry"
        }
    ])
    
    results = []
    
    for brand_config in brand_configs:
        for scenario in test_scenarios:
            try:
                # Generate prompt using our advanced function
                prompt = generate_review_reply_prompt(
                    scenario['review_text'],
                    scenario['rating'],
                    {
                        "tone": brand_config['tone'],
                        "key_phrases": brand_config['key_phrases']
                    },
                    brand_config['niche']
                )
                
                # Generate demo response (OpenAI removed)
                print("Using demo response generation")
                if scenario['rating'] >= 4:
                    ai_response = f"Thank you for the wonderful {scenario['rating']}-star review! We're delighted you love your {brand_config['niche']} piece."
                elif scenario['rating'] == 3:
                    ai_response = f"Thank you for your honest feedback about your {brand_config['niche']} experience. We appreciate you taking the time to share."
                else:
                    ai_response = f"Thank you for bringing this to our attention. We take all feedback about our {brand_config['niche']} seriously and want to make this right."
                
                results.append({
                    "scenario": scenario['name'],
                    "brand_config": brand_config['name'],
                    "original_review": scenario['review_text'],
                    "rating": scenario['rating'],
                    "ai_response": ai_response,
                    "prompt_used": prompt[:200] + "..." if len(prompt) > 200 else prompt
                })
                
            except Exception as e:
                results.append({
                    "scenario": scenario['name'],
                    "brand_config": brand_config['name'],
                    "error": str(e)
                })
    
    return jsonify({
        "message": "Prompt engineering test completed",
        "total_tests": len(results),
        "results": results
    }), 200

@app.route('/analyze-prompt', methods=['POST'])
def analyze_prompt_quality():
    """
    Analyze the quality of generated responses based on specific criteria
    """
    data = request.json
    responses = data.get('responses', [])
    
    analysis_results = []
    
    for response_data in responses:
        ai_response = response_data.get('ai_response', '')
        original_review = response_data.get('original_review', '')
        rating = response_data.get('rating', 0)
        
        # Quality metrics
        quality_score = {
            "authenticity": 0,  # Sounds human, not robotic
            "specificity": 0,   # References specific details from review
            "tone_match": 0,    # Matches intended brand tone
            "emotional_intelligence": 0,  # Appropriate emotional response
            "actionability": 0, # Includes clear next steps when needed
            "total_score": 0
        }
        
        # Authenticity check (avoid generic phrases)
        generic_phrases = ['thank you for your review', 'we appreciate your feedback', 'sorry for any inconvenience']
        if not any(phrase in ai_response.lower() for phrase in generic_phrases):
            quality_score["authenticity"] += 20
        
        # Specificity check (mentions specific aspects from review)
        review_words = set(original_review.lower().split())
        response_words = set(ai_response.lower().split())
        overlap = len(review_words.intersection(response_words))
        if overlap > 2:
            quality_score["specificity"] = min(20, overlap * 3)
        
        # Emotional intelligence (appropriate response to sentiment)
        if rating >= 4 and any(word in ai_response.lower() for word in ['thrilled', 'delighted', 'wonderful']):
            quality_score["emotional_intelligence"] += 20
        elif rating <= 2 and any(word in ai_response.lower() for word in ['sorry', 'apologize', 'understand']):
            quality_score["emotional_intelligence"] += 20
        
        # Actionability (includes next steps when appropriate)
        action_phrases = ['contact us', 'reach out', 'let us know', 'we\'ll', 'happy to help']
        if rating <= 3 and any(phrase in ai_response.lower() for phrase in action_phrases):
            quality_score["actionability"] += 20
        
        # Calculate total score
        quality_score["total_score"] = sum([v for k, v in quality_score.items() if k != "total_score"])
        
        analysis_results.append({
            "response": ai_response,
            "quality_metrics": quality_score,
            "recommendations": generate_improvement_recommendations(quality_score, ai_response, rating)
        })
    
    return jsonify({
        "message": "Response quality analysis completed",
        "results": analysis_results
    }), 200

def generate_improvement_recommendations(quality_score, ai_response, rating):
    """
    Generate specific recommendations for improving AI responses
    """
    recommendations = []
    
    if quality_score["authenticity"] < 15:
        recommendations.append("Make response more conversational and less template-like")
    
    if quality_score["specificity"] < 10:
        recommendations.append("Reference specific details from the customer's review")
    
    if quality_score["emotional_intelligence"] < 15:
        if rating >= 4:
            recommendations.append("Show more enthusiasm and excitement for positive reviews")
        elif rating <= 2:
            recommendations.append("Express more empathy and understanding for negative reviews")
    
    if quality_score["actionability"] < 10 and rating <= 3:
        recommendations.append("Include clear next steps or call-to-action for resolution")
    
    if len(ai_response.split()) > 100:
        recommendations.append("Keep response more concise (aim for 2-4 sentences)")
    
    return recommendations

@app.route('/generate-variations', methods=['POST'])
def generate_response_variations():
    """
    Generate multiple variations of responses for A/B testing
    """
    data = request.json
    review_text = data.get('review_text')
    rating = data.get('rating')
    brand_config = data.get('brand_config', {})
    niche = data.get('niche', 'handmade jewelry')
    
    if not review_text or rating is None:
        return jsonify({"message": "Missing review_text or rating"}), 400
    
    # Generate variations with different approaches
    variations = []
    
    variation_configs = [
        {"temperature": 0.3, "approach": "Conservative"},
        {"temperature": 0.7, "approach": "Balanced"},
        {"temperature": 0.9, "approach": "Creative"},
    ]
    
    for config in variation_configs:
        try:
            prompt = generate_review_reply_prompt(
                review_text, rating, brand_config, niche
            )
            
            if openai.api_key:
                chat_completion = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an expert customer service representative."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=config["temperature"],
                    max_tokens=150
                )
                ai_response = chat_completion.choices[0].message.content.strip()
            else:
                ai_response = "[Simulation - " + config['approach'] + " approach]"
            
            variations.append({
                "approach": config["approach"],
                "temperature": config["temperature"],
                "response": ai_response
            })
        except Exception as e:
            variations.append({
                "approach": config["approach"],
                "error": str(e)
            })
    
    return jsonify({
        "message": "Response variations generated",
        "original_review": review_text,
        "rating": rating,
        "variations": variations
    }), 200

# --- SENTIENT AI XAI ENDPOINT ---

@app.route('/api/generate-response-xai', methods=['POST'])
def generate_response_xai():
    """
    Advanced AI response generation with explainable AI features
    """
    try:
        data = request.json
        review_text = data.get('review', '')
        rating = data.get('rating', 5)
        platform = data.get('platform', 'Google')
        context = data.get('context', '')
        sliders = data.get('sliders', {})
        brand_voice = data.get('brand_voice_preferences', {})
        
        if not review_text:
            return jsonify({'error': 'Review text is required'}), 400
        
        # Enhanced prompt with XAI considerations
        formality = sliders.get('formality', 50)
        empathy = sliders.get('empathy', 70)
        length = sliders.get('length', 60)
        actionability = sliders.get('actionability', 40)
        
        # Adjust tone based on sliders
        tone_descriptor = "professional" if formality > 70 else "casual" if formality < 30 else "balanced"
        empathy_descriptor = "highly empathetic" if empathy > 70 else "measured" if empathy < 30 else "understanding"
        length_descriptor = "detailed" if length > 70 else "concise" if length < 30 else "moderate"
        action_descriptor = "with specific next steps" if actionability > 70 else "informative" if actionability < 30 else "with gentle suggestions"
        
        # Create enhanced prompt
        enhanced_prompt = "Generate a response to this review. Original Review: " + review_text + ". Additional Context: " + context + ". Generate a response that acknowledges the customer experience and maintains our brand reputation."
        
        # Generate demo response (OpenAI removed)
        print("Using demo response generation")
        if rating >= 4:
            ai_response = f"Thank you so much for your wonderful {rating}-star review! We're thrilled that you had such a positive experience with us."
        elif rating == 3:
            ai_response = "Thank you for taking the time to share your feedback with us. We appreciate your honest review and are always working to improve."
        else:
            ai_response = f"Thank you for your {rating}-star review. We sincerely apologize that your experience didn't meet expectations. We'd love to make this right - please contact us directly."
        
        # Calculate demo confidence score
        confidence_score = 0.75
        
        # Generate demo justifications
        justifications = generate_justifications(review_text, ai_response, rating, sliders)
        
        # Calculate brand voice alignment score
        brand_voice_score = calculate_brand_voice_score(ai_response, brand_voice)
        
        return jsonify({
            'response': ai_response,
            'confidence_score': confidence_score,
            'justifications': justifications,
            'brand_voice_score': brand_voice_score,
            'generation_time': round(time.time() % 10, 2),
            'demo_mode': True,
            'analysis': {
                'tone_applied': tone_descriptor,
                'empathy_level': empathy_descriptor,
                'length_category': length_descriptor,
                'actionability': action_descriptor
            }
        })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def calculate_confidence_score(response, original_review, sliders):
    """Calculate AI confidence score based on response quality indicators"""
    score = 70  # Base score
    
    # Length appropriateness
    response_length = len(response.split())
    if 20 <= response_length <= 100:
        score += 10
    
    # Mentions specific details from original review
    original_words = set(original_review.lower().split())
    response_words = set(response.lower().split())
    overlap = len(original_words.intersection(response_words))
    score += min(overlap * 2, 15)
    
    # Slider coherence bonus
    if all(30 <= v <= 70 for v in sliders.values()):
        score += 5  # Balanced settings bonus
    
    return min(score, 98)

def generate_justifications(review_text, response, rating, sliders):
    """Generate explanations for AI decision making"""
    justifications = []
    
    # Analyze tone decision
    if sliders.get('formality', 50) > 70:
        justifications.append({
            'reason': 'Professional tone emphasized',
            'evidence': 'Formality slider set high - suited for business context'
        })
    elif sliders.get('formality', 50) < 30:
        justifications.append({
            'reason': 'Casual tone adopted',
            'evidence': 'Formality slider set low - creates friendly, approachable response'
        })
    
    # Analyze empathy application
    if sliders.get('empathy', 70) > 70:
        justifications.append({
            'reason': 'High empathy response crafted',
            'evidence': 'Empathy level high - addresses emotional undertones in review'
        })
    
    # Review-specific analysis
    positive_indicators = ['good', 'great', 'excellent', 'amazing', 'love']
    found_positive = [word for word in positive_indicators if word in review_text.lower()]
    
    if found_positive and int(rating) >= 4:
        justifications.append({
            'reason': 'Positive sentiment acknowledged',
            'evidence': 'Detected positive keywords with high rating'
        })
    
    return justifications

def calculate_brand_voice_score(response, brand_voice_prefs):
    """Calculate how well response matches brand voice"""
    score = 80  # Base score
    
    # Check tone alignment
    target_tone = brand_voice_prefs.get('tone', 'professional-friendly')
    if 'professional' in target_tone and any(word in response.lower() for word in ['appreciate', 'thank', 'pleased']):
        score += 10
    
    # Check for appropriate formality
    formal_indicators = ['appreciate', 'pleased', 'delighted', 'sincerely']
    if any(indicator in response.lower() for indicator in formal_indicators):
        score += 8
    
    return min(score, 96)

# Error handlers for better debugging
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Not Found",
        "message": "The requested resource was not found",
        "available_endpoints": [
            "/", "/health", "/api/status", 
            "/dashboard.html", "/prompt-lab.html"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal Server Error",
        "message": "An internal server error occurred",
        "contact": "Check logs for more details"
    }), 500

# Add a catch-all route for debugging
@app.route('/debug')
def debug_info():
    """Debug endpoint to check file structure"""
    import glob
    
    files = glob.glob("*.html")
    return jsonify({
        "working_directory": os.getcwd(),
        "html_files": files,
        "all_files": os.listdir('.'),
        "flask_env": os.environ.get("FLASK_ENV"),
        "port": os.environ.get("PORT")
    })

if __name__ == '__main__':
    # For local development, run with `python app.py`
    # In production, use a WSGI server like Gunicorn
    print("Starting AI Review Response Automation Platform...")
    print("Backend server running on http://localhost:5001")
    print("Webhook endpoint: http://localhost:5001/webhook/new-review")
    
    # Production-ready configuration
    port = int(os.environ.get("PORT", 5001))
    debug_mode = os.environ.get("FLASK_ENV") != "production"
    
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
