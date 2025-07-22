// Dashboard functionality
class ReviewDashboard {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.currentReviewId = null;
        this.ratingChart = null;
        
        this.init();
    }

    async init() {
        // Initialize navigation
        this.setupNavigation();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup modal handlers
        this.setupModal();
        
        // Setup form handlers
        this.setupForms();
        
        // Refresh data every 30 seconds
        setInterval(() => this.loadDashboardData(), 30000);
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSection(target);
                
                // Update active nav
                navLinks.forEach(l => {
                    l.classList.remove('border-blue-500', 'text-gray-900');
                    l.classList.add('border-transparent', 'text-gray-500');
                });
                link.classList.remove('border-transparent', 'text-gray-500');
                link.classList.add('border-blue-500', 'text-gray-900');
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Load section-specific data
        if (sectionName === 'reviews') {
            this.loadReviews();
        } else if (sectionName === 'settings') {
            this.loadBrandSettings();
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiUrl}/analytics`);
            const data = await response.json();
            
            this.updateDashboardStats(data);
            this.updateCharts(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboardStats(data) {
        document.getElementById('total-reviews').textContent = data.total_reviews || 0;
        document.getElementById('pending-reviews').textContent = data.pending_reviews || 0;
        document.getElementById('published-reviews').textContent = data.published_reviews || 0;
        document.getElementById('avg-rating').textContent = data.average_rating ? 
            data.average_rating.toFixed(1) + '⭐' : '-';
        
        // Update response rate
        const responseRate = data.total_reviews > 0 ? 
            Math.round((data.published_reviews / data.total_reviews) * 100) : 0;
        document.getElementById('response-rate').textContent = responseRate + '%';
    }

    updateCharts(data) {
        // Rating distribution chart
        const ctx = document.getElementById('ratingChart').getContext('2d');
        
        if (this.ratingChart) {
            this.ratingChart.destroy();
        }
        
        this.ratingChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1⭐', '2⭐', '3⭐', '4⭐', '5⭐'],
                datasets: [{
                    label: 'Reviews',
                    data: [
                        data.rating_distribution?.['1'] || 0,
                        data.rating_distribution?.['2'] || 0,
                        data.rating_distribution?.['3'] || 0,
                        data.rating_distribution?.['4'] || 0,
                        data.rating_distribution?.['5'] || 0
                    ],
                    backgroundColor: [
                        '#EF4444', // red for 1 star
                        '#F97316', // orange for 2 stars
                        '#EAB308', // yellow for 3 stars
                        '#84CC16', // lime for 4 stars
                        '#22C55E'  // green for 5 stars
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    async loadReviews() {
        try {
            const response = await fetch(`${this.apiUrl}/reviews`);
            const reviews = await response.json();
            
            const reviewsList = document.getElementById('reviews-list');
            reviewsList.innerHTML = '';
            
            const pendingReviews = reviews.filter(r => r.status === 'pending');
            
            if (pendingReviews.length === 0) {
                reviewsList.innerHTML = `
                    <li class="px-4 py-4 text-center text-gray-500">
                        <i class="fas fa-check-circle text-4xl text-green-400 mb-2"></i>
                        <p>No pending reviews! All caught up.</p>
                    </li>
                `;
                return;
            }
            
            pendingReviews.forEach(review => {
                const li = document.createElement('li');
                li.className = 'px-4 py-4 hover:bg-gray-50 cursor-pointer';
                li.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center">
                                <div class="text-yellow-400 mr-2">
                                    ${'⭐'.repeat(review.rating)}
                                </div>
                                <p class="text-sm font-medium text-gray-900 truncate">
                                    ${review.review_text.substring(0, 100)}...
                                </p>
                            </div>
                            <div class="mt-1 flex items-center text-sm text-gray-500">
                                <i class="fas fa-user mr-1"></i>
                                <span>${review.customer_name || 'Anonymous'}</span>
                                <span class="mx-2">•</span>
                                <span>${new Date(review.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div class="ml-4 flex-shrink-0">
                            <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                Review Response
                            </button>
                        </div>
                    </div>
                `;
                
                li.addEventListener('click', () => this.showReviewModal(review));
                reviewsList.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to load reviews:', error);
        }
    }

    showReviewModal(review) {
        this.currentReviewId = review.id;
        
        document.getElementById('modal-review').innerHTML = `
            <div class="flex items-center mb-2">
                <div class="text-yellow-400 mr-2">${'⭐'.repeat(review.rating)}</div>
                <span class="text-sm text-gray-500">${review.customer_name || 'Anonymous'}</span>
            </div>
            <p>${review.review_text}</p>
        `;
        
        document.getElementById('modal-response').value = review.ai_response || '';
        document.getElementById('review-modal').classList.remove('hidden');
    }

    setupModal() {
        const modal = document.getElementById('review-modal');
        const closeBtn = document.getElementById('close-modal');
        const approveBtn = document.getElementById('approve-btn');
        const rejectBtn = document.getElementById('reject-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
        
        approveBtn.addEventListener('click', () => this.approveReview());
        rejectBtn.addEventListener('click', () => this.rejectReview());
    }

    async approveReview() {
        if (!this.currentReviewId) return;
        
        const response = document.getElementById('modal-response').value;
        
        try {
            await fetch(`${this.apiUrl}/reviews/${this.currentReviewId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ response })
            });
            
            document.getElementById('review-modal').classList.add('hidden');
            this.loadReviews();
            this.loadDashboardData();
            this.showNotification('Review approved and published!', 'success');
        } catch (error) {
            console.error('Failed to approve review:', error);
            this.showNotification('Failed to approve review', 'error');
        }
    }

    async rejectReview() {
        if (!this.currentReviewId) return;
        
        try {
            await fetch(`${this.apiUrl}/reviews/${this.currentReviewId}/reject`, {
                method: 'POST'
            });
            
            document.getElementById('review-modal').classList.add('hidden');
            this.loadReviews();
            this.loadDashboardData();
            this.showNotification('Review rejected', 'info');
        } catch (error) {
            console.error('Failed to reject review:', error);
            this.showNotification('Failed to reject review', 'error');
        }
    }

    async loadBrandSettings() {
        try {
            const response = await fetch(`${this.apiUrl}/brand-settings`);
            const settings = await response.json();
            
            document.getElementById('brand-tone').value = settings.tone || '';
            document.getElementById('key-phrases').value = settings.key_phrases ? 
                settings.key_phrases.join(', ') : '';
            document.getElementById('niche-context').value = settings.niche || 'other';
        } catch (error) {
            console.error('Failed to load brand settings:', error);
        }
    }

    setupForms() {
        // Brand settings form
        const brandForm = document.getElementById('brand-settings-form');
        brandForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(brandForm);
            const settings = {
                tone: formData.get('tone'),
                key_phrases: formData.get('key_phrases').split(',').map(p => p.trim()).filter(p => p),
                niche: formData.get('niche')
            };
            
            try {
                await fetch(`${this.apiUrl}/brand-settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(settings)
                });
                
                this.showNotification('Brand settings updated!', 'success');
            } catch (error) {
                console.error('Failed to update settings:', error);
                this.showNotification('Failed to update settings', 'error');
            }
        });

        // Test AI form
        const testBtn = document.getElementById('test-generate-btn');
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                await this.testAIResponse();
            });
        }
    }

    async testAIResponse() {
        const reviewText = document.getElementById('test-review-text').value.trim();
        const rating = document.getElementById('test-rating').value;
        const niche = document.getElementById('test-niche').value;
        
        if (!reviewText) {
            this.showNotification('Please enter a review text', 'error');
            return;
        }

        const testResult = document.getElementById('test-result');
        const testResponse = document.getElementById('test-response');
        const testLoading = document.getElementById('test-loading');
        
        // Show loading state
        testResult.classList.remove('hidden');
        testLoading.classList.remove('hidden');
        testResponse.innerHTML = '';
        
        try {
            const response = await fetch(`${this.apiUrl}/webhook/new-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: `test_${Date.now()}`,
                    review_text: reviewText,
                    review_rating: parseInt(rating),
                    reviewer_name: 'Test Customer',
                    product_id: 'test_product',
                    niche_context: niche
                })
            });
            
            const data = await response.json();
            
            // Hide loading
            testLoading.classList.add('hidden');
            
            if (response.ok && data.ai_response) {
                testResponse.innerHTML = `<p class="text-gray-900">${data.ai_response}</p>`;
                this.showNotification('AI response generated successfully!', 'success');
            } else {
                testResponse.innerHTML = `<p class="text-red-600">Error: ${data.message || 'Failed to generate response'}</p>`;
                this.showNotification('Failed to generate AI response', 'error');
            }
        } catch (error) {
            testLoading.classList.add('hidden');
            testResponse.innerHTML = `<p class="text-red-600">Network error: ${error.message}</p>`;
            this.showNotification('Network error occurred', 'error');
            console.error('Test AI error:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Test functionality for demo purposes
class TestMode {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.setupTestControls();
    }

    setupTestControls() {
        // Add test controls if in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.addTestButton();
        }
    }

    addTestButton() {
        const testBtn = document.createElement('button');
        testBtn.innerHTML = '<i class="fas fa-flask"></i> Test Mode';
        testBtn.className = 'fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50';
        testBtn.addEventListener('click', () => this.showTestModal());
        document.body.appendChild(testBtn);
    }

    showTestModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Test Review Simulation</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Rating</label>
                        <select id="test-rating" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Review Text</label>
                        <textarea id="test-review" rows="3" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Enter test review..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input type="text" id="test-customer" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Customer Name">
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button id="cancel-test" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md">Cancel</button>
                        <button id="submit-test" class="px-4 py-2 bg-purple-600 text-white rounded-md">Send Test Review</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#cancel-test').addEventListener('click', () => modal.remove());
        modal.querySelector('#submit-test').addEventListener('click', () => this.submitTestReview(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async submitTestReview(modal) {
        const rating = document.getElementById('test-rating').value;
        const reviewText = document.getElementById('test-review').value;
        const customerName = document.getElementById('test-customer').value;
        
        if (!reviewText.trim()) {
            alert('Please enter a review text');
            return;
        }
        
        try {
            const response = await fetch(`${this.dashboard.apiUrl}/webhook/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: parseInt(rating),
                    review_text: reviewText,
                    customer_name: customerName || 'Test Customer',
                    platform: 'test',
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                modal.remove();
                this.dashboard.showNotification('Test review sent successfully!', 'success');
                setTimeout(() => {
                    this.dashboard.loadDashboardData();
                    this.dashboard.loadReviews();
                }, 1000);
            } else {
                throw new Error('Failed to send test review');
            }
        } catch (error) {
            console.error('Test review failed:', error);
            this.dashboard.showNotification('Failed to send test review', 'error');
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new ReviewDashboard();
    new TestMode(dashboard);
});
