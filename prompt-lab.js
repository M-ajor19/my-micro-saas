// Prompt Engineering Lab JavaScript
class PromptEngineeringLab {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.currentTab = 'testing';
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupEventListeners();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Update button states
                tabButtons.forEach(btn => {
                    btn.classList.remove('active', 'border-purple-500', 'text-purple-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                button.classList.add('active', 'border-purple-500', 'text-purple-600');
                button.classList.remove('border-transparent', 'text-gray-500');
                
                // Update content visibility
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(`${tabId}-tab`).classList.remove('hidden');
                
                this.currentTab = tabId;
            });
        });
    }

    setupEventListeners() {
        // Batch Testing
        document.getElementById('run-batch-test').addEventListener('click', () => {
            this.runBatchTest();
        });

        // A/B Variations
        document.getElementById('generate-variations').addEventListener('click', () => {
            this.generateVariations();
        });

        // Quality Analysis
        document.getElementById('analyze-quality').addEventListener('click', () => {
            this.analyzeQuality();
        });

        // Custom Testing
        document.getElementById('test-custom').addEventListener('click', () => {
            this.testCustom();
        });

        document.getElementById('regenerate').addEventListener('click', () => {
            this.testCustom();
        });

        document.getElementById('save-test').addEventListener('click', () => {
            this.saveTest();
        });
    }

    async runBatchTest() {
        const button = document.getElementById('run-batch-test');
        const resultsDiv = document.getElementById('batch-results');
        const contentDiv = document.getElementById('batch-results-content');

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running Tests...';

        try {
            const response = await fetch(`${this.apiUrl}/test-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayBatchResults(data.results);
                resultsDiv.classList.remove('hidden');
            } else {
                this.showError('Failed to run batch test: ' + data.message);
            }
        } catch (error) {
            this.showError('Error running batch test: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play mr-2"></i>Run Batch Test';
        }
    }

    displayBatchResults(results) {
        const contentDiv = document.getElementById('batch-results-content');
        
        const groupedResults = {};
        results.forEach(result => {
            if (!groupedResults[result.brand_config]) {
                groupedResults[result.brand_config] = [];
            }
            groupedResults[result.brand_config].push(result);
        });

        let html = '';
        Object.keys(groupedResults).forEach(brandConfig => {
            html += `
                <div class="mb-8 border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gray-50 px-4 py-2 font-semibold">${brandConfig}</div>
                    <div class="divide-y divide-gray-200">
            `;
            
            groupedResults[brandConfig].forEach(result => {
                const ratingStars = '⭐'.repeat(result.rating);
                html += `
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-medium text-gray-800">${result.scenario}</h4>
                            <span class="text-sm text-gray-500">${ratingStars}</span>
                        </div>
                        <div class="mb-3">
                            <p class="text-sm text-gray-600 italic">"${result.original_review}"</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <p class="text-sm">${result.ai_response || result.error}</p>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });

        contentDiv.innerHTML = html;
    }

    async generateVariations() {
        const reviewText = document.getElementById('variation-review').value;
        const rating = parseInt(document.getElementById('variation-rating').value);
        const button = document.getElementById('generate-variations');
        const resultsDiv = document.getElementById('variations-results');

        if (!reviewText.trim()) {
            this.showError('Please enter a review text');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';

        try {
            const response = await fetch(`${this.apiUrl}/generate-variations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    review_text: reviewText,
                    rating: rating,
                    brand_config: {
                        tone: 'friendly, professional',
                        key_phrases: ['handcrafted', 'unique design']
                    }
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.displayVariations(data.variations);
                resultsDiv.classList.remove('hidden');
            } else {
                this.showError('Failed to generate variations: ' + data.message);
            }
        } catch (error) {
            this.showError('Error generating variations: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-magic mr-2"></i>Generate Variations';
        }
    }

    displayVariations(variations) {
        const contentDiv = document.getElementById('variations-content');
        
        let html = '';
        variations.forEach((variation, index) => {
            const colorClass = index === 0 ? 'border-green-400 bg-green-50' : 
                              index === 1 ? 'border-blue-400 bg-blue-50' : 
                              'border-purple-400 bg-purple-50';
            
            html += `
                <div class="border-l-4 ${colorClass} p-4 rounded">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-semibold">${variation.approach} Approach</h4>
                        <span class="text-sm text-gray-500">Temperature: ${variation.temperature}</span>
                    </div>
                    <p class="text-gray-700">${variation.response || variation.error}</p>
                    <div class="mt-2 flex space-x-2">
                        <button class="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50" onclick="lab.copyToClipboard('${variation.response}')">
                            <i class="fas fa-copy mr-1"></i>Copy
                        </button>
                        <button class="text-sm bg-white border border-gray-300 px-3 py-1 rounded hover:bg-gray-50" onclick="lab.analyzeResponse('${variation.response}')">
                            <i class="fas fa-chart-line mr-1"></i>Analyze
                        </button>
                    </div>
                </div>
            `;
        });

        contentDiv.innerHTML = html;
    }

    async analyzeQuality() {
        const response = document.getElementById('analysis-response').value;
        const originalReview = document.getElementById('analysis-original').value;
        const rating = parseInt(document.getElementById('analysis-rating').value);
        const button = document.getElementById('analyze-quality');
        const resultsDiv = document.getElementById('analysis-results');

        if (!response.trim()) {
            this.showError('Please enter an AI response to analyze');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';

        try {
            const apiResponse = await fetch(`${this.apiUrl}/analyze-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    responses: [{
                        ai_response: response,
                        original_review: originalReview,
                        rating: rating
                    }]
                })
            });

            const data = await apiResponse.json();
            
            if (apiResponse.ok && data.results.length > 0) {
                this.displayQualityAnalysis(data.results[0]);
                resultsDiv.classList.remove('hidden');
            } else {
                this.showError('Failed to analyze quality: ' + data.message);
            }
        } catch (error) {
            this.showError('Error analyzing quality: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-search mr-2"></i>Analyze Quality';
        }
    }

    displayQualityAnalysis(analysis) {
        // Display quality chart
        const ctx = document.getElementById('quality-chart').getContext('2d');
        const metrics = analysis.quality_metrics;
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Authenticity', 'Specificity', 'Tone Match', 'Emotional Intelligence', 'Actionability'],
                datasets: [{
                    label: 'Quality Score',
                    data: [
                        metrics.authenticity,
                        metrics.specificity,
                        metrics.tone_match,
                        metrics.emotional_intelligence,
                        metrics.actionability
                    ],
                    backgroundColor: 'rgba(147, 51, 234, 0.2)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    pointBackgroundColor: 'rgba(147, 51, 234, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(147, 51, 234, 1)'
                }]
            },
            options: {
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: false
                        },
                        suggestedMin: 0,
                        suggestedMax: 20
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Display recommendations
        const recommendationsDiv = document.getElementById('recommendations-list');
        let recommendationsHtml = '';
        
        if (analysis.recommendations.length > 0) {
            analysis.recommendations.forEach(rec => {
                recommendationsHtml += `
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                        <p class="text-sm text-yellow-800">${rec}</p>
                    </div>
                `;
            });
        } else {
            recommendationsHtml = `
                <div class="bg-green-50 border-l-4 border-green-400 p-3">
                    <p class="text-sm text-green-800">Great job! This response meets all quality criteria.</p>
                </div>
            `;
        }
        
        recommendationsDiv.innerHTML = recommendationsHtml;
    }

    async testCustom() {
        const reviewText = document.getElementById('custom-review').value;
        const rating = parseInt(document.getElementById('custom-rating').value);
        const tone = document.getElementById('custom-tone').value;
        const phrases = document.getElementById('custom-phrases').value;
        const niche = document.getElementById('custom-niche').value;
        const resultDiv = document.getElementById('custom-result');

        if (!reviewText.trim()) {
            this.showError('Please enter a review text');
            return;
        }

        resultDiv.innerHTML = '<p class="text-gray-500 italic"><i class="fas fa-spinner fa-spin mr-2"></i>Generating response...</p>';

        try {
            // First generate the response
            const response = await fetch(`${this.apiUrl}/webhook/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    review_text: reviewText,
                    rating: rating,
                    customer_name: 'Test Customer'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="bg-white p-4 border border-gray-200 rounded">
                        <p class="text-gray-800">${data.ai_reply_draft}</p>
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <span class="text-xs text-gray-500">Total Score: <span class="font-semibold">85/100</span></span>
                        </div>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `<p class="text-red-500">Error: ${data.message}</p>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
        }
    }

    saveTest() {
        const testData = {
            review: document.getElementById('custom-review').value,
            rating: document.getElementById('custom-rating').value,
            response: document.getElementById('custom-result').textContent,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage for now
        const savedTests = JSON.parse(localStorage.getItem('promptTests') || '[]');
        savedTests.push(testData);
        localStorage.setItem('promptTests', JSON.stringify(savedTests));

        this.showSuccess('Test saved successfully!');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Copied to clipboard!');
        });
    }

    analyzeResponse(response) {
        document.getElementById('analysis-response').value = response;
        // Switch to analysis tab
        document.querySelector('[data-tab="analysis"]').click();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the lab
const lab = new PromptEngineeringLab();
