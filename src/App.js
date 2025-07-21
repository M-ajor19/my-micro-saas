import React from 'react';
import './App.css';
import ReviewList from './components/ReviewList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Review Response Automation</h1>
        <p>Intelligent e-commerce review management platform</p>
      </header>
      <main>
        <ReviewList />
      </main>
    </div>
  );
}

export default App;
