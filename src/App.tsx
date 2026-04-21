/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Home from './pages/Home';
import Meeting from './pages/Meeting';
import AuthCallback from './pages/AuthCallback';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import InstallPWA from '@/components/InstallPWA';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home session={null} />} />
          <Route path="/meet/:code" element={<Meeting session={null} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
        <InstallPWA />
      </div>
    </BrowserRouter>
  );
}

