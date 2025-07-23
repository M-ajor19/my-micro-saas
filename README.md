# AI Review Response Automation Platform

A complete full-stack solution for automating e-commerce review responses using AI.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API key

### Backend Setup (Flask)

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

3. **Start the Flask backend:**
```bash
python app.py
```
The backend will run on `http://localhost:5000`

### Frontend Setup (React)

1. **Install React dependencies:**
```bash
# If using the React version
cd src
npm install axios react react-dom react-scripts
npm start
```

2. **Or use the HTML/JavaScript version:**
Simply open `dashboard.html` in your browser and ensure the Flask backend is running.

## 📱 Available Interfaces

### 1. Modern Dashboard (HTML/JS)
- **File:** `dashboard.html`
- **Features:** 
  - Analytics dashboard with charts
  - Review management interface
  - Brand settings configuration
  - Test mode for simulating reviews
- **Tech Stack:** HTML, TailwindCSS, Chart.js, Vanilla JavaScript

### 2. React Components
- **Files:** `src/components/ReviewList.js`, `src/App.js`
- **Features:**
  - Component-based architecture
  - Real-time review simulation
  - Approve/reject workflow
- **Tech Stack:** React, Axios, CSS3

## 🔧 API Endpoints

### Reviews
- `POST /webhook/new-review` - Receive new review webhooks
- `GET /api/reviews/pending` - Get pending reviews
- `GET /api/reviews/all` - Get all reviews
- `POST /reviews/{id}/approve` - Approve review response
- `POST /reviews/{id}/reject` - Reject review

### Analytics
- `GET /analytics` - Get dashboard analytics

### Settings
- `GET /brand-settings` - Get brand voice settings
- `POST /brand-settings` - Update brand settings

## 🎯 Features

### Core Functionality
- ✅ AI-powered review response generation
- ✅ Webhook integration for e-commerce platforms
- ✅ Review approval workflow
- ✅ Brand voice customization
- ✅ Analytics and reporting
- ✅ Test mode for development

### AI Capabilities
- Context-aware responses based on review sentiment
- Niche-specific language (handmade jewelry, clothing, etc.)
- Brand tone consistency
- Rating-based response strategies

### Security
- Webhook signature verification
- CORS protection
- Environment variable configuration
- Thread-safe data operations

## 🛠 Development

### Testing the Platform

1. **Start the backend:**
```bash
python app.py
```

2. **Open the dashboard:**
- HTML version: Open `dashboard.html` in browser
- React version: Run `npm start` in the src directory

3. **Test with simulated reviews:**
- Click the "Test Mode" button (purple flask icon)
- Send test reviews to see AI responses
- Approve or reject responses

### Adding E-commerce Platform Integration

The platform is designed to integrate with:
- **Shopify:** Using webhooks and Admin API
- **Amazon:** Via MWS/SP-API (requires approval)
- **eBay:** Through eBay API
- **WooCommerce:** Custom webhooks
- **Custom platforms:** Generic webhook support

### Customizing AI Responses

Edit the `generate_review_reply_prompt()` function in `app.py` to:
- Adjust tone and style
- Add industry-specific phrases
- Modify response strategies
- Include brand guidelines

## 📊 Data Storage

Currently uses JSON file storage for MVP. For production:
- Migrate to PostgreSQL/MySQL
- Add user authentication
- Implement multi-tenant architecture
- Add data encryption

## 🚀 Production Deployment

### Backend (Flask)
```bash
# Using Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend
```bash
# Build React app
npm run build

# Serve static files
npx serve -s build
```

### Environment Variables
```bash
OPENAI_API_KEY=your_production_key
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
FLASK_ENV=production
DATABASE_URL=your_database_url
```

## 🎨 Customization

### Brand Voice Settings
- Tone: professional, friendly, casual, etc.
- Key phrases: brand-specific terminology
- Niche context: industry-specific language

### Response Strategies
- **5-star reviews:** Express gratitude, reinforce brand values
- **4-star reviews:** Thank and address minor concerns
- **3-star reviews:** Acknowledge feedback, offer improvements
- **1-2 star reviews:** Apologize, offer resolution, maintain professionalism

## 📈 Analytics

Track key metrics:
- Total reviews processed
- Response rate
- Rating distribution
- Approval/rejection rates
- Platform performance

## 🔒 Security Considerations

1. **API Keys:** Store in environment variables
2. **Webhook Verification:** Validate signatures
3. **Input Sanitization:** Clean user inputs
4. **Rate Limiting:** Implement in production
5. **HTTPS:** Use SSL certificates


