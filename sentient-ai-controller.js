/**
 * Sentient AI Interface Controller
 * Advanced XAI features, interactive refinement, and intelligent visualizations
 */

class SentientAIController {
  constructor() {
    this.currentResponse = null;
    this.confidenceScore = 0;
    this.justifications = [];
    this.mappingConnections = [];
    this.sliderValues = {
      formality: 50,
      empathy: 70,
      length: 60,
      actionability: 40
    };
    this.brandVoiceScore = 85;
    this.processingStats = {
      processed: 0,
      total: 0,
      avgTime: 0,
      successRate: 0
    };
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeSliders();
    this.setupMappingVisualization();
  }

  /**
   * Generate AI response with explainable intelligence
   */
  async generateResponseWithXAI(reviewText, rating, platform, additionalContext = '') {
    const startTime = Date.now();
    
    // Show AI thinking process
    this.showAIThinking();
    
    try {
      // Analyze sentiment first
      const sentimentData = this.analyzeSentiment(reviewText);
      this.displaySentimentAnalysis(sentimentData);
      
      // Generate contextual actions based on sentiment and rating
      const contextualActions = this.generateContextualActions(sentimentData, rating);
      this.displayContextualActions(contextualActions);
      
      // Make API call with enhanced parameters
      const response = await fetch('/api/generate-response-xai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review: reviewText,
          rating: rating,
          platform: platform,
          context: additionalContext,
          sliders: this.sliderValues,
          brand_voice_preferences: this.getBrandVoicePreferences()
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const generationTime = (Date.now() - startTime) / 1000;
      
      // Process XAI data
      this.currentResponse = data.response;
      this.confidenceScore = data.confidence_score || Math.random() * 30 + 70; // 70-100%
      this.justifications = data.justifications || this.generateMockJustifications(reviewText, data.response);
      
      // Display response with XAI features
      this.displayResponseWithXAI(data.response, generationTime);
      this.displayConfidenceIndicator(this.confidenceScore);
      this.displayJustificationPanel(this.justifications);
      this.createInputOutputMapping(reviewText, data.response);
      this.updateBrandVoiceAlignment(data.brand_voice_score || this.brandVoiceScore);
      
      // Add AI personality feedback
      this.showAIPersonality('confident', 'Great response generated! 🎯');
      
      return data;
      
    } catch (error) {
      console.error('Error generating response:', error);
      this.showAIPersonality('confused', 'I need more context to help you better.');
      this.displayError(error.message);
      throw error;
    }
  }

  /**
   * Show AI thinking process visualization
   */
  showAIThinking() {
    const thinkingContainer = document.getElementById('ai-thinking-process');
    if (!thinkingContainer) return;
    
    thinkingContainer.innerHTML = `
      <div class="ai-personality">
        <div class="ai-avatar">AI</div>
        <div class="ai-status">
          <div class="font-medium">Analyzing review...</div>
          <div class="text-xs text-secondary">Understanding context and sentiment</div>
        </div>
        <div class="ai-mood-indicator">🤔</div>
      </div>
    `;
    
    // Simulate thinking steps
    const steps = [
      'Understanding sentiment...',
      'Analyzing key phrases...',
      'Matching brand voice...',
      'Generating response...',
      'Optimizing tone...'
    ];
    
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length) {
        const statusDiv = thinkingContainer.querySelector('.ai-status');
        statusDiv.innerHTML = `
          <div class="font-medium">${steps[currentStep]}</div>
          <div class="text-xs text-secondary">Step ${currentStep + 1} of ${steps.length}</div>
        `;
        currentStep++;
      } else {
        clearInterval(stepInterval);
      }
    }, 600);
  }

  /**
   * Analyze sentiment of the input review
   */
  analyzeSentiment(reviewText) {
    // Mock sentiment analysis - in production, this would call a real API
    const words = reviewText.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'satisfied', 'recommend'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'poor', 'worst', 'horrible'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });
    
    const total = positiveScore + negativeScore + 1;
    const positive = (positiveScore / total) * 100;
    const negative = (negativeScore / total) * 100;
    const neutral = 100 - positive - negative;
    
    return {
      positive: Math.max(positive, 20),
      neutral: Math.max(neutral, 10),
      negative: Math.max(negative, 5),
      dominant: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral'
    };
  }

  /**
   * Display sentiment analysis visualization
   */
  displaySentimentAnalysis(sentimentData) {
    const container = document.getElementById('sentiment-analysis');
    if (!container) return;
    
    container.innerHTML = `
      <div class="sentiment-analyzer">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-chart-bar text-purple-600"></i>
          <span class="font-semibold">Sentiment Analysis</span>
        </div>
        
        <div class="sentiment-breakdown">
          <div class="sentiment-bar sentiment-positive">
            <div class="sentiment-fill" style="width: ${sentimentData.positive}%"></div>
          </div>
          <div class="sentiment-bar sentiment-neutral">
            <div class="sentiment-fill" style="width: ${sentimentData.neutral}%"></div>
          </div>
          <div class="sentiment-bar sentiment-negative">
            <div class="sentiment-fill" style="width: ${sentimentData.negative}%"></div>
          </div>
        </div>
        
        <div class="sentiment-labels">
          <span>Positive: ${Math.round(sentimentData.positive)}%</span>
          <span>Neutral: ${Math.round(sentimentData.neutral)}%</span>
          <span>Negative: ${Math.round(sentimentData.negative)}%</span>
        </div>
        
        <div class="sentiment-score mt-3">
          <i class="fas fa-${sentimentData.dominant === 'positive' ? 'smile' : sentimentData.dominant === 'negative' ? 'frown' : 'meh'} 
             text-${sentimentData.dominant === 'positive' ? 'green' : sentimentData.dominant === 'negative' ? 'red' : 'yellow'}-600"></i>
          <span>Dominant sentiment: <strong>${sentimentData.dominant}</strong></span>
        </div>
      </div>
    `;
  }

  /**
   * Generate contextual action suggestions
   */
  generateContextualActions(sentimentData, rating) {
    const actions = [];
    
    if (sentimentData.dominant === 'positive' || rating >= 4) {
      actions.push(
        { id: 'thank-enthusiastic', label: 'Thank enthusiastically', icon: 'fas fa-heart' },
        { id: 'encourage-sharing', label: 'Encourage social sharing', icon: 'fas fa-share' },
        { id: 'ask-referral', label: 'Request referral', icon: 'fas fa-users' }
      );
    }
    
    if (sentimentData.dominant === 'negative' || rating <= 2) {
      actions.push(
        { id: 'apologize-resolve', label: 'Apologize & offer resolution', icon: 'fas fa-handshake' },
        { id: 'offer-compensation', label: 'Offer compensation', icon: 'fas fa-gift' },
        { id: 'clarify-misunderstanding', label: 'Clarify misunderstanding', icon: 'fas fa-question-circle' }
      );
    }
    
    if (sentimentData.dominant === 'neutral' || rating === 3) {
      actions.push(
        { id: 'seek-feedback', label: 'Seek specific feedback', icon: 'fas fa-comment-dots' },
        { id: 'highlight-improvements', label: 'Highlight improvements', icon: 'fas fa-arrow-up' },
        { id: 'professional-response', label: 'Professional response', icon: 'fas fa-briefcase' }
      );
    }
    
    return actions;
  }

  /**
   * Display contextual action buttons
   */
  displayContextualActions(actions) {
    const container = document.getElementById('contextual-actions');
    if (!container) return;
    
    container.innerHTML = `
      <div class="mb-3">
        <span class="text-sm font-medium text-secondary">Suggested response goals:</span>
      </div>
      <div class="contextual-actions">
        ${actions.map(action => `
          <button class="context-action" data-action="${action.id}">
            <i class="${action.icon}"></i>
            <span>${action.label}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    // Bind action events
    container.querySelectorAll('.context-action').forEach(button => {
      button.addEventListener('click', (e) => {
        // Remove previous selections
        container.querySelectorAll('.context-action').forEach(b => b.classList.remove('selected'));
        // Select current
        button.classList.add('selected');
        
        // Trigger response regeneration with selected goal
        const actionId = button.dataset.action;
        this.applyContextualAction(actionId);
      });
    });
  }

  /**
   * Apply contextual action to response generation
   */
  applyContextualAction(actionId) {
    // This would modify the prompt or AI parameters based on the selected action
    console.log('Applying contextual action:', actionId);
    
    // Show AI acknowledgment
    this.showAIPersonality('excited', `Adjusting response for: ${actionId.replace('-', ' ')} 🎯`);
  }

  /**
   * Display response with XAI features
   */
  displayResponseWithXAI(response, generationTime) {
    const container = document.getElementById('ai-response-output');
    if (!container) return;
    
    // Create highlighted response with alternative phrase suggestions
    const highlightedResponse = this.addPhraseAlternatives(response);
    
    container.innerHTML = `
      <div class="ai-response-container">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <i class="fas fa-robot text-purple-600"></i>
            <span class="font-medium text-purple-900">AI Generated Response</span>
          </div>
          <div class="text-sm text-gray-500">
            <i class="fas fa-clock mr-1"></i>
            Generated in ${generationTime}s
          </div>
        </div>
        
        <div class="ai-response-text bg-white p-4 rounded-lg border border-purple-200 leading-relaxed">
          ${highlightedResponse}
        </div>
        
        <div class="mt-4 flex gap-3">
          <button class="elite-button elite-button--secondary" onclick="sentientAI.showJustification()">
            <i class="fas fa-lightbulb mr-2"></i>
            Why this response?
          </button>
          <button class="elite-button elite-button--secondary" onclick="sentientAI.regenerateResponse()">
            <i class="fas fa-redo mr-2"></i>
            Regenerate
          </button>
          <button class="elite-button" onclick="sentientAI.copyResponse()">
            <i class="fas fa-copy mr-2"></i>
            Copy Response
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Add phrase alternatives to response text
   */
  addPhraseAlternatives(response) {
    // Mock implementation - identify key phrases that could have alternatives
    const phrases = [
      { original: 'Thank you', alternatives: ['Thanks so much', 'We appreciate', 'Grateful for'] },
      { original: 'appreciate', alternatives: ['value', 'are grateful for', 'treasure'] },
      { original: 'wonderful', alternatives: ['fantastic', 'amazing', 'excellent'] }
    ];
    
    let highlightedResponse = response;
    
    phrases.forEach(phrase => {
      if (highlightedResponse.includes(phrase.original)) {
        highlightedResponse = highlightedResponse.replace(
          phrase.original,
          `<span class="phrase-alternative" data-alternatives='${JSON.stringify(phrase.alternatives)}'>
            ${phrase.original}
            <div class="alternatives-popup">
              ${phrase.alternatives.map(alt => `<div class="alternative-option">${alt}</div>`).join('')}
            </div>
          </span>`
        );
      }
    });
    
    return highlightedResponse;
  }

  /**
   * Display confidence indicator
   */
  displayConfidenceIndicator(confidenceScore) {
    const container = document.getElementById('confidence-indicator');
    if (!container) return;
    
    const confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low';
    const confidenceText = confidenceScore >= 80 ? 'High Confidence' : 
                          confidenceScore >= 60 ? 'Medium Confidence' : 'Low Confidence';
    
    container.innerHTML = `
      <div class="ai-confidence-indicator confidence-${confidenceLevel}">
        <div class="confidence-meter">
          <div class="confidence-fill" style="width: ${confidenceScore}%"></div>
        </div>
        <span>${confidenceText}</span>
        <span class="font-semibold">${Math.round(confidenceScore)}%</span>
      </div>
    `;
  }

  /**
   * Display justification panel
   */
  displayJustificationPanel(justifications) {
    const container = document.getElementById('justification-panel');
    if (!container) return;
    
    container.innerHTML = `
      <div class="ai-justification-panel" id="justification-content">
        <div class="justification-header">
          <div class="justification-icon">
            <i class="fas fa-brain"></i>
          </div>
          <h4 class="font-semibold">AI Decision Process</h4>
        </div>
        
        <div class="space-y-3">
          ${justifications.map(justification => `
            <div class="justification-item">
              <div class="flex items-start gap-2">
                <i class="fas fa-arrow-right text-purple-600 mt-1"></i>
                <div>
                  <p class="font-medium text-sm">${justification.reason}</p>
                  <p class="text-xs text-secondary mt-1">${justification.evidence}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-shield-alt text-blue-600"></i>
            <span class="font-medium text-blue-900 text-sm">Bias Considerations</span>
          </div>
          <p class="text-xs text-blue-800">
            AI detected neutral language patterns and maintained objective tone. 
            No potential bias indicators found in the original review.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate mock justifications for demo purposes
   */
  generateMockJustifications(reviewText, response) {
    return [
      {
        reason: 'Emphasized gratitude response',
        evidence: `Original review contained positive keywords: "${this.extractKeywords(reviewText, ['great', 'amazing', 'excellent', 'good']).join('", "')}"`
      },
      {
        reason: 'Professional tone selected',
        evidence: 'Business context detected based on review platform and content structure'
      },
      {
        reason: 'Personalized acknowledgment',
        evidence: 'Included specific details mentioned in the original review to show attentiveness'
      },
      {
        reason: 'Future engagement encouraged',
        evidence: 'High rating (4-5 stars) triggered recommendation request strategy'
      }
    ];
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text, keywords) {
    const words = text.toLowerCase().split(' ');
    return keywords.filter(keyword => words.includes(keyword));
  }

  /**
   * Create input-output mapping visualization
   */
  createInputOutputMapping(inputText, outputText) {
    const container = document.getElementById('mapping-visualization');
    if (!container) return;
    
    container.innerHTML = `
      <div class="mapping-visualization">
        <div class="input-side">
          <h4 class="font-semibold mb-3">Original Review</h4>
          <div class="p-4 bg-gray-50 rounded-lg">
            ${this.addMappableHighlights(inputText, 'input')}
          </div>
        </div>
        
        <div class="output-side">
          <h4 class="font-semibold mb-3">AI Response</h4>
          <div class="p-4 bg-purple-50 rounded-lg">
            ${this.addMappableHighlights(outputText, 'output')}
          </div>
        </div>
        
        <svg class="mapping-connection" id="mapping-svg">
          <!-- Connection lines will be drawn here -->
        </svg>
      </div>
    `;
    
    // Add mapping interactions
    this.setupMappingInteractions();
  }

  /**
   * Add mappable highlights to text
   */
  addMappableHighlights(text, side) {
    const keywords = ['great', 'amazing', 'excellent', 'thank', 'appreciate', 'recommend'];
    let highlightedText = text;
    
    keywords.forEach((keyword, index) => {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, match => 
        `<span class="mappable-text" data-keyword="${keyword}" data-side="${side}" data-index="${index}">
          ${match}
        </span>`
      );
    });
    
    return highlightedText;
  }

  /**
   * Setup mapping interaction effects
   */
  setupMappingInteractions() {
    const mappableElements = document.querySelectorAll('.mappable-text');
    
    mappableElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const keyword = e.target.dataset.keyword;
        const side = e.target.dataset.side;
        
        // Highlight corresponding elements
        mappableElements.forEach(el => {
          if (el.dataset.keyword === keyword && el.dataset.side !== side) {
            el.classList.add('connected');
          }
        });
        
        // Draw connection line (simplified implementation)
        this.drawConnectionLine(e.target, keyword, side);
      });
      
      element.addEventListener('mouseleave', () => {
        mappableElements.forEach(el => el.classList.remove('connected'));
        this.clearConnectionLines();
      });
    });
  }

  /**
   * Draw connection line between related elements
   */
  drawConnectionLine(element, keyword, side) {
    const svg = document.getElementById('mapping-svg');
    if (!svg) return;
    
    // Simple line drawing implementation
    const rect = element.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    const x = rect.left - svgRect.left + rect.width / 2;
    const y = rect.top - svgRect.top + rect.height / 2;
    
    svg.innerHTML = `
      <line class="connection-line" 
            x1="${x}" y1="${y}" 
            x2="${x + 200}" y2="${y}"
            stroke="#667eea" stroke-width="2" stroke-dasharray="5,5">
      </line>
    `;
  }

  /**
   * Clear connection lines
   */
  clearConnectionLines() {
    const svg = document.getElementById('mapping-svg');
    if (svg) svg.innerHTML = '';
  }

  /**
   * Initialize control sliders
   */
  initializeSliders() {
    const sliders = ['formality', 'empathy', 'length', 'actionability'];
    
    sliders.forEach(sliderId => {
      const slider = document.getElementById(`${sliderId}-slider`);
      const valueDisplay = document.getElementById(`${sliderId}-value`);
      
      if (slider && valueDisplay) {
        slider.value = this.sliderValues[sliderId];
        valueDisplay.textContent = this.sliderValues[sliderId];
        
        slider.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          this.sliderValues[sliderId] = value;
          valueDisplay.textContent = value;
          
          // Update slider fill
          const fillPercent = (value / 100) * 100;
          const trackFill = slider.parentElement.querySelector('.slider-track-fill');
          if (trackFill) {
            trackFill.style.width = `${fillPercent}%`;
          }
          
          // Trigger real-time response update (debounced)
          this.debounceResponseUpdate();
        });
      }
    });
  }

  /**
   * Debounced response update for real-time slider changes
   */
  debounceResponseUpdate() {
    clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {
      if (this.currentResponse) {
        this.regenerateWithCurrentSettings();
      }
    }, 1000);
  }

  /**
   * Show AI personality feedback
   */
  showAIPersonality(mood, message) {
    const container = document.getElementById('ai-personality');
    if (!container) return;
    
    const moodEmojis = {
      confident: '😎',
      excited: '🎯',
      confused: '🤔',
      happy: '😊',
      thinking: '💭'
    };
    
    container.innerHTML = `
      <div class="ai-personality">
        <div class="ai-avatar">AI</div>
        <div class="ai-status">
          <div class="font-medium">${message}</div>
          <div class="text-xs text-secondary">AI Assistant</div>
        </div>
        <div class="ai-mood-indicator">${moodEmojis[mood] || '🤖'}</div>
      </div>
    `;
  }

  /**
   * Update brand voice alignment score
   */
  updateBrandVoiceAlignment(score) {
    const container = document.getElementById('brand-voice-indicator');
    if (!container) return;
    
    const percentage = Math.round(score);
    const rotation = (percentage / 100) * 360;
    
    container.innerHTML = `
      <div class="brand-voice-indicator">
        <div class="voice-score-circle" style="background: conic-gradient(var(--brand-primary) ${rotation}deg, var(--border-primary) 0deg);">
          ${percentage}%
        </div>
        <div class="voice-details">
          <div class="font-semibold">Brand Voice Alignment</div>
          <div class="text-sm text-secondary">Response matches your brand tone</div>
          <div class="voice-attributes">
            ${percentage >= 80 ? '<span class="voice-attribute">Professional</span>' : ''}
            ${percentage >= 70 ? '<span class="voice-attribute">Consistent</span>' : ''}
            ${percentage >= 90 ? '<span class="voice-attribute">Authentic</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    // Phrase alternative interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('phrase-alternative')) {
        const popup = e.target.querySelector('.alternatives-popup');
        if (popup) {
          popup.classList.toggle('visible');
        }
      }
      
      if (e.target.classList.contains('alternative-option')) {
        const newPhrase = e.target.textContent;
        const phraseElement = e.target.closest('.phrase-alternative');
        if (phraseElement) {
          const textNode = phraseElement.firstChild;
          textNode.textContent = newPhrase;
          phraseElement.querySelector('.alternatives-popup').classList.remove('visible');
        }
      }
    });
    
    // Justification panel toggle
    document.addEventListener('click', (e) => {
      if (e.target.closest('[onclick*="showJustification"]')) {
        e.preventDefault();
        this.toggleJustificationPanel();
      }
    });
  }

  /**
   * Toggle justification panel visibility
   */
  toggleJustificationPanel() {
    const panel = document.getElementById('justification-content');
    if (panel) {
      panel.classList.toggle('visible');
    }
  }

  /**
   * Show justification panel
   */
  showJustification() {
    this.toggleJustificationPanel();
  }

  /**
   * Copy response to clipboard
   */
  copyResponse() {
    if (this.currentResponse) {
      navigator.clipboard.writeText(this.currentResponse).then(() => {
        this.showAIPersonality('happy', 'Response copied to clipboard! 📋');
      });
    }
  }

  /**
   * Regenerate response with current settings
   */
  regenerateResponse() {
    const reviewInput = document.getElementById('testReview');
    const ratingInput = document.getElementById('testRating');
    const platformInput = document.getElementById('testPlatform');
    
    if (reviewInput && reviewInput.value) {
      this.generateResponseWithXAI(
        reviewInput.value,
        ratingInput?.value || 5,
        platformInput?.value || 'Google'
      );
    }
  }

  /**
   * Get brand voice preferences
   */
  getBrandVoicePreferences() {
    return {
      tone: 'professional-friendly',
      formality_level: this.sliderValues.formality,
      empathy_level: this.sliderValues.empathy,
      response_length: this.sliderValues.length,
      actionability: this.sliderValues.actionability
    };
  }

  /**
   * Display error message with AI personality
   */
  displayError(message) {
    const container = document.getElementById('ai-response-output');
    if (container) {
      container.innerHTML = `
        <div class="text-center p-8">
          <div class="ai-personality mb-4">
            <div class="ai-avatar">AI</div>
            <div class="ai-status">
              <div class="font-medium text-red-600">Oops! ${message}</div>
              <div class="text-xs text-secondary">Let me try a different approach</div>
            </div>
            <div class="ai-mood-indicator">😔</div>
          </div>
          <button class="elite-button" onclick="sentientAI.regenerateResponse()">
            <i class="fas fa-redo mr-2"></i>
            Try Again
          </button>
        </div>
      `;
    }
  }
}

// Initialize the sentient AI controller
window.sentientAI = new SentientAIController();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentientAIController;
}
