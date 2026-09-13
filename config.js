
// Supabase Configuration
// Replace these values with your actual Supabase project credentials
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlbWV5Z2lvc2pod2hqamNkaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTc1NDYsImV4cCI6MjEwNDYzMzU0Nn0.kP-THpnqNzlDv1nrxUbMNv1BYZ4-ym8ct7fAK9zY0Ng';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
