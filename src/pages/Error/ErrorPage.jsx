import React from 'react';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="text-center space-y-6">
                <h1 className="text-9xl font-bold text-base-content">404</h1>
                <div className="space-y-2">
                    <h2 className="text-4xl font-semibold text-base-content">Page Not Found</h2>
                    <p className="text-base-content/60">Sorry, we couldn't find the page you're looking for.</p>
                </div>
                <Link 
                    to="/" 
                    className="inline-block px-6 py-3 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors duration-300 shadow-lg hover:shadow-xl"
                >
                    Go to Home
                </Link>
            </div>
        </div>
    );
};

export default ErrorPage;