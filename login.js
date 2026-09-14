// Login page functionality
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        setupEventListeners();
        checkExistingSession();
    }

    async function checkExistingSession() {
        if (!supabase || !supabase.auth) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                window.location.href = 'admin.html';
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
        }
    }

    function setupEventListeners() {
        document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
        document.getElementById('passwordToggle')?.addEventListener('click', togglePasswordVisibility);
        document.getElementById('forgotPasswordLink')?.addEventListener('click', openForgotPasswordModal);
        document.getElementById('forgotPasswordClose')?.addEventListener('click', closeForgotPasswordModal);
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', handlePasswordReset);
    }

    async function handleLogin(e) {
        e.preventDefault();

        if (!supabase || !supabase.auth) {
            alert('Error: el cliente de Supabase no ha cargado. Recarga la página.');
            return;
        }

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');
        const btnText = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginSpinner');

        submitBtn.disabled = true;
        btnText.textContent = 'Accediendo...';
        spinner.style.display = 'inline-block';

        try {
            let result;
            if (typeof supabase.auth.signInWithPassword === 'function') {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else if (typeof supabase.auth.signIn === 'function') {
                result = await supabase.auth.signIn({ email, password });
            } else {
                throw new Error('No se encontró método de autenticación');
            }

            const { data, error } = result;

            if (error) throw error;

            window.location.href = 'admin.html';
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
            submitBtn.disabled = false;
            btnText.textContent = 'Iniciar Sesión';
            spinner.style.display = 'none';
        }
    }

    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('loginPassword');
        const toggleIcon = document.getElementById('passwordToggleIcon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🔒';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁';
        }
    }

    function openForgotPasswordModal(e) {
        e.preventDefault();
        if (!supabase || !supabase.auth) {
            alert('Error: el cliente de Supabase no ha cargado.');
            return;
        }
        document.getElementById('forgotPasswordModal').classList.add('active');
    }

    function closeForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').classList.remove('active');
    }

    async function handlePasswordReset(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;

        try {
            const { error } = await supabase.auth.resetPasswordEmail(email, {
                redirectTo: window.location.origin + window.location.pathname,
            });

            if (error) throw error;

            alert('Se ha enviado un enlace de recuperación a tu correo.');
            document.getElementById('forgotPasswordModal').classList.remove('active');
            document.getElementById('forgotPasswordForm').reset();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
})();
