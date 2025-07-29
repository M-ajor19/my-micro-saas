"""
Google AI Service for ResponseAI Platform
Provides intelligent review analysis and response generation using Google Gemini
"""

import os
import json
import re
from typing import Dict, Any, List
from datetime import datetime

try:
    import google.generativeai as genai
    google_ai_available = True
except ImportError:
    google_ai_available = False
    genai = None


class GoogleAIService:
    """
    Google AI service providing review response generation and analysis
    """
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")
        self.model_available = False
        
        if self.api_key and google_ai_available:
            try:
                genai.configure(api_key=self.api_key)
                # Test if API is working by listing models
                models = genai.list_models()
                self.model_available = True
                print("✅ Google AI initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize Google AI: {e}")
                self.model_available = False
        else:
            print("⚠️ Google AI not available - using demo responses")
        
        # Sentiment analysis keywords
        self.sentiment_keywords = {
            'positive': ['excellent', 'amazing', 'fantastic', 'perfect', 'outstanding', 'wonderful', 
                        'great', 'love', 'best', 'recommend', 'impressed', 'delighted', 'happy',
                        'satisfied', 'quality', 'fast', 'helpful', 'beautiful', 'gorgeous'],
            'negative': ['terrible', 'awful', 'horrible', 'worst', 'disappointed', 'angry',
                        'frustrated', 'broken', 'damaged', 'slow', 'poor', 'cheap', 'useless',
                        'waste', 'refund', 'return', 'complaint', 'issue', 'problem']
        }

    def generate_ai_response(self, review_text: str, rating: int, brand_settings: Dict, 
                           language: str = 'en') -> Dict[str, Any]:
        """Generate AI response using Google AI"""
        
        if not self.model_available:
            return self._generate_demo_response(review_text, rating, brand_settings)
        
        try:
            # Create a detailed prompt for Google AI
            tone = brand_settings.get('tone', 'professional')
            brand_name = brand_settings.get('brand_name', 'our business')
            
            prompt = f"""Generate a {tone} customer service response to this review:

Review: "{review_text}"
Rating: {rating}/5 stars
Brand: {brand_name}
Tone: {tone}

Guidelines:
- Be authentic and personalized
- Address specific points mentioned
- Thank the customer appropriately
- If rating is low (1-2), apologize and offer to make it right
- If rating is high (4-5), express genuine gratitude
- Keep response concise but meaningful
- Match the {tone} tone consistently

Response:"""
            
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt=prompt,
                temperature=0.7,
                max_output_tokens=150
            )
            
            if response.result:
                return {
                    "response": response.result.strip(),
                    "confidence": 0.92,
                    "tone": tone,
                    "sentiment": self._analyze_sentiment(review_text),
                    "ai_powered": True,
                    "model": "google-palm"
                }
            else:
                return self._generate_demo_response(review_text, rating, brand_settings)
            
        except Exception as e:
            print(f"Google AI error: {e}")
            return self._generate_demo_response(review_text, rating, brand_settings)

    def analyze_sentiment(self, review_text: str) -> Dict[str, Any]:
        """Analyze sentiment of review text"""
        
        if not self.model_available:
            return self._analyze_sentiment_basic(review_text)
        
        try:
            prompt = f"""Analyze the sentiment of this review. Respond with only: positive, negative, or neutral.

Review: "{review_text}"

Sentiment:"""
            
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt=prompt,
                temperature=0.3,
                max_output_tokens=10
            )
            
            if response.result:
                sentiment = response.result.strip().lower()
                if sentiment in ['positive', 'negative', 'neutral']:
                    return {
                        "sentiment": sentiment,
                        "confidence": 0.85,
                        "emotions": [sentiment],
                        "aspects": {"overall": sentiment},
                        "key_phrases": [],
                        "ai_powered": True
                    }
            
            return self._analyze_sentiment_basic(review_text)
                
        except Exception as e:
            print(f"Google AI sentiment analysis error: {e}")
            return self._analyze_sentiment_basic(review_text)

    def generate_improvements(self, reviews: List[Dict]) -> Dict[str, Any]:
        """Generate improvement suggestions based on reviews"""
        
        if not self.model_available or len(reviews) == 0:
            return self._generate_demo_improvements()
        
        try:
            # Prepare review summary for analysis
            review_summary = []
            for review in reviews[-10:]:  # Last 10 reviews
                review_summary.append(f"Rating: {review.get('review_rating', 'N/A')}/5 - {review.get('review_text', '')}")
            
            reviews_text = "\n".join(review_summary)
            
            prompt = f"""Based on these customer reviews, provide 3 specific improvement suggestions:

Reviews:
{reviews_text}

Provide 3 actionable improvements:
1.
2. 
3."""
            
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt=prompt,
                temperature=0.7,
                max_output_tokens=200
            )
            
            if response.result:
                suggestions_text = response.result.strip()
                # Parse the numbered suggestions
                suggestions = []
                for line in suggestions_text.split('\n'):
                    if line.strip() and (line.strip().startswith(('1.', '2.', '3.'))):
                        suggestions.append(line.strip()[2:].strip())
                
                return {
                    "product_improvements": suggestions[:1] if suggestions else ["Improve product quality based on feedback"],
                    "service_improvements": suggestions[1:2] if len(suggestions) > 1 else ["Enhance customer service response"],
                    "experience_improvements": suggestions[2:3] if len(suggestions) > 2 else ["Streamline customer experience"],
                    "ai_powered": True,
                    "based_on_reviews": len(reviews),
                    "model": "google-palm"
                }
            else:
                return self._generate_demo_improvements()
                
        except Exception as e:
            print(f"Google AI improvements error: {e}")
            return self._generate_demo_improvements()

    def _generate_demo_response(self, review_text: str, rating: int, brand_settings: Dict) -> Dict[str, Any]:
        """Generate demo response when AI is not available"""
        if rating >= 4:
            response = f"Thank you so much for your wonderful {rating}-star review! We're thrilled that you had such a positive experience with us."
        elif rating == 3:
            response = "Thank you for taking the time to share your feedback with us. We appreciate your honest review and are always working to improve."
        else:
            response = f"Thank you for your {rating}-star review. We sincerely apologize that your experience didn't meet expectations. We'd love to make this right - please contact us directly."
        
        return {
            "response": response,
            "confidence": 0.75,
            "tone": brand_settings.get('tone', 'professional'),
            "sentiment": self._analyze_sentiment(review_text),
            "ai_powered": False,
            "demo_mode": True
        }

    def _analyze_sentiment(self, review_text: str) -> str:
        """Basic sentiment analysis"""
        text_lower = review_text.lower()
        
        positive_count = sum(1 for word in self.sentiment_keywords['positive'] if word in text_lower)
        negative_count = sum(1 for word in self.sentiment_keywords['negative'] if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"

    def _analyze_sentiment_basic(self, review_text: str) -> Dict[str, Any]:
        """Basic sentiment analysis fallback"""
        sentiment = self._analyze_sentiment(review_text)
        
        return {
            "sentiment": sentiment,
            "confidence": 0.7,
            "emotions": [sentiment],
            "aspects": {"overall": sentiment},
            "key_phrases": [],
            "ai_powered": False,
            "demo_mode": True
        }

    def _generate_demo_improvements(self) -> Dict[str, Any]:
        """Demo improvement suggestions"""
        return {
            "product_improvements": [
                "Consider faster shipping options",
                "Improve packaging quality",
                "Add detailed product descriptions"
            ],
            "service_improvements": [
                "Implement live chat support",
                "Create comprehensive FAQ section",
                "Provide proactive order updates"
            ],
            "experience_improvements": [
                "Simplify checkout process",
                "Add customer loyalty program",
                "Improve mobile website experience"
            ],
            "communication_improvements": [
                "Send order confirmation emails faster",
                "Provide tracking information proactively",
                "Follow up after delivery"
            ],
            "priority_areas": ["shipping speed", "customer communication"],
            "overall_sentiment_trend": "stable",
            "ai_powered": False,
            "demo_mode": True
        }

    def detect_business_issues(self, reviews: List[Dict]) -> Dict[str, Any]:
        """Detect potential business issues from review patterns"""
        
        if not self.model_available or len(reviews) < 5:
            return {
                "issues_detected": [],
                "severity": "low",
                "recommendations": ["Monitor reviews closely", "Collect more feedback"],
                "ai_powered": False,
                "analysis_complete": False
            }
        
        try:
            # Analyze recent negative reviews
            recent_reviews = reviews[-15:]  # Last 15 reviews
            negative_reviews = [r for r in recent_reviews if int(r.get('review_rating', 5)) <= 2]
            
            if len(negative_reviews) == 0:
                return {
                    "issues_detected": [],
                    "severity": "low", 
                    "recommendations": ["Continue monitoring feedback"],
                    "ai_powered": True,
                    "analysis_complete": True
                }
            
            review_text = "\n".join([f"Rating: {r.get('review_rating')}/5 - {r.get('review_text', '')}" 
                                   for r in negative_reviews])
            
            prompt = f"""Analyze these negative reviews to identify business issues:

{review_text}

What specific problems are mentioned? List the top 3 issues and severity level (high/medium/low)."""
            
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt=prompt,
                temperature=0.3,
                max_output_tokens=150
            )
            
            if response.result:
                analysis = response.result.strip()
                
                # Extract issues from response
                issues = []
                if "delivery" in analysis.lower() or "shipping" in analysis.lower():
                    issues.append("Delivery/shipping delays")
                if "quality" in analysis.lower() or "defect" in analysis.lower():
                    issues.append("Product quality concerns")
                if "service" in analysis.lower() or "support" in analysis.lower():
                    issues.append("Customer service issues")
                if "price" in analysis.lower() or "cost" in analysis.lower():
                    issues.append("Pricing concerns")
                
                severity = "high" if len(negative_reviews) > 5 else "medium" if len(negative_reviews) > 2 else "low"
                
                return {
                    "issues_detected": issues,
                    "severity": severity,
                    "recommendations": [
                        "Address quality control processes",
                        "Improve customer communication",
                        "Review operational efficiency"
                    ],
                    "ai_powered": True,
                    "analysis_complete": True,
                    "negative_reviews_count": len(negative_reviews)
                }
            else:
                return {
                    "issues_detected": ["Unable to analyze"],
                    "severity": "medium",
                    "recommendations": ["Manual review needed"],
                    "ai_powered": False,
                    "analysis_complete": False
                }
                
        except Exception as e:
            print(f"Google AI issue detection error: {e}")
            return {
                "issues_detected": ["Analysis error"],
                "severity": "unknown",
                "recommendations": ["Technical review needed"],
                "ai_powered": False,
                "analysis_complete": False
            }

    def test_connection(self) -> Dict[str, Any]:
        """Test Google AI connection"""
        if not self.api_key:
            return {
                "status": "error",
                "message": "No Google API key provided",
                "available": False
            }
        
        if not google_ai_available:
            return {
                "status": "error", 
                "message": "Google AI library not installed",
                "available": False
            }
        
        try:
            genai.configure(api_key=self.api_key)
            
            # Test with simple prompt
            response = genai.generate_text(
                model='models/text-bison-001',
                prompt="Say 'Google AI test successful'",
                max_output_tokens=10
            )
            
            if response.result:
                self.model_available = True
                return {
                    "status": "success",
                    "message": "Google AI connection successful",
                    "test_response": response.result.strip(),
                    "model": "text-bison-001",
                    "available": True
                }
            else:
                return {
                    "status": "error",
                    "message": "No response from Google AI",
                    "available": False
                }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Google AI connection failed: {str(e)}",
                "available": False
            }
