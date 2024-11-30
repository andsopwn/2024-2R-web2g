/**
 * 로그인 및 회원가입 처리를 위한 JavaScript 파일
 */

// 상수 정의
const ROUTES = {
    MAIN: '/main',
    HOME: '/'
};

const ERROR_MESSAGES = {
    LOGIN_FAILED: '로그인에 실패했습니다.',
    EMAIL_FORMAT: '이메일은 영문과 숫자만 입력 가능합니다.',
    STUDENT_ID_FORMAT: '학번은 10자리 숫자여야 합니다.',
    PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
    SIGNUP_FAILED: '회원가입 처리 중 오류가 발생했습니다.'
};

// DOM 요소
const elements = {
    welcomeContent: document.getElementById('welcomeContent'),
    loginContent: document.getElementById('loginContent'),
    signupContent: document.getElementById('signupContent'),
    // 폼 요소들도 추가
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    // 입력 필드들도 추가
    studentIdInput: document.getElementById('studentId'),
    passwordInput: document.getElementById('password')
};

// 화면 전환 함수
function showLoginForm() {
    if (elements.welcomeContent) elements.welcomeContent.style.display = 'none';
    if (elements.signupContent) elements.signupContent.style.display = 'none';
    if (elements.loginContent) elements.loginContent.style.display = 'block';
}

function showSignupForm() {
    if (elements.welcomeContent) elements.welcomeContent.style.display = 'none';
    if (elements.loginContent) elements.loginContent.style.display = 'none';
    if (elements.signupContent) elements.signupContent.style.display = 'block';
}

function showWelcomeForm() {
    if (elements.loginContent) elements.loginContent.style.display = 'none';
    if (elements.signupContent) elements.signupContent.style.display = 'none';
    if (elements.welcomeContent) elements.welcomeContent.style.display = 'block';
}

// 로그인 처리 함수
async function handleLogin(event) {
    event.preventDefault();
    
    const loginData = {
        studentId: elements.studentIdInput.value,
        password: elements.passwordInput.value
    };
    
    try {
        // 기본적인 입력값 검증
        if (!loginData.studentId || !loginData.password) {
            throw new Error('학번과 비밀번호를 모두 입력해주세요.');
        }

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
            credentials: 'include'  // 세션 쿠키를 위해 필요
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '로그인에 실패했습니다.');
        }

        // 로그인 성공 시 세션 스토리지에 사용자 정보 저장
        sessionStorage.setItem('userId', data.user.id);
        sessionStorage.setItem('studentId', data.user.username);
        sessionStorage.setItem('userName', data.user.name);

        // 메인 페이지로 리다이렉트
        window.location.href = '/main';
        
    } catch (error) {
        alert(error.message);
        console.error('로그인 오류:', error);
    }
}

// 회원가입 유효성 검사
function validateSignupData(signupData) {
    const { emailLocal, studentId, password, passwordConfirm } = signupData;

    if (!/^[a-zA-Z0-9]+$/.test(emailLocal)) {
        throw new Error(ERROR_MESSAGES.EMAIL_FORMAT);
    }
    
    if (!/^\d{10}$/.test(studentId)) {
        throw new Error(ERROR_MESSAGES.STUDENT_ID_FORMAT);
    }
    
    if (password !== passwordConfirm) {
        throw new Error(ERROR_MESSAGES.PASSWORD_MISMATCH);
    }
}

// 회원가입 처리 함수
async function handleSignup(event) {
    event.preventDefault();
    
    const signupData = {
        emailLocal: document.getElementById('signupEmailLocal').value,
        emailDomain: document.getElementById('signupEmailDomain').value,
        name: document.getElementById('signupName').value,
        studentId: document.getElementById('signupStudentId').value,
        password: document.getElementById('signupPassword').value,
        passwordConfirm: document.getElementById('signupPasswordConfirm').value
    };

    try {
        validateSignupData(signupData);

        const email = `${signupData.emailLocal}@${signupData.emailDomain}`;
        
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                name: signupData.name,
                studentId: signupData.studentId,
                password: signupData.password
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            showLoginForm();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        alert(error.message);
    }
}

// 이메일 입력 제한 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    // welcomeContent를 보이게 만듦
    const content = document.querySelector('.content');
    if (content) {
        content.classList.add('visible');
    }
    const emailInput = document.getElementById('signupEmailLocal');
    
    emailInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    });
    console.log('login.js loaded'); // 개발자 도구 콘솔에서 확인
});
