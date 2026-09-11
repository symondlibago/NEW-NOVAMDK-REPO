import React from 'react';
import Home from '../components/Home';
import Seo from '../components/Seo';
import { Toaster } from '../components/ui/toaster';

const Platform = () => {
  return (
    <div className="min-h-screen bg-white">
      <Seo
        path="/"
        description="Personalized prescription treatments, reviewed by licensed physicians and delivered to your door."
      />
      <Home />
      <Toaster />
    </div>
  );
};

export default Platform;