// Supabase Configuration
const SUPABASE_URL = 'https://bemeygiosjhwhjjcdhce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWV5Z2lvc2pod2hqamNkaGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTc1NDYsImV4cCI6MjEwNDYzMzU0Nn0.kP-THpnqNzlDv1nrxUbMNv1BYZ4-ym8ct7fAK9zY0Ng';

// Initialize Supabase client
var supabase = null;
if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn('Supabase library not loaded. Check that supabase.min.js is loaded before config.js');
}
