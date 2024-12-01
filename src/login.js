// 로그인 폼 표시 함수
function showLoginForm() {
    document.getElementById('welcomeContent').style.display = 'none';
    document.getElementById('signupContent').style.display = 'none';
    document.getElementById('loginContent').style.display = 'block';
}

// 회원가입 폼 표시 함수
function showSignupForm() {
    document.getElementById('loginContent').style.display = 'none';
    document.getElementById('signupContent').style.display = 'block';
}

// 로그인 처리 함수
async function handleLogin(event) {
    event.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ studentId, password }),
            credentials: 'include'
        });

        const data = await response.json();
        
        if (response.ok) {
            sessionStorage.setItem('userId', data.user.id);
            sessionStorage.setItem('studentId', data.user.username);
            window.location.href = '/main';
        } else {
            alert(data.error || '로그인에 실패했습니다.');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        alert('로그인 처리 중 오류가 발생했습니다.');
    }
}

// 회원가입 처리 함수
async function handleSignup(event) {
    event.preventDefault();
    
    // ID를 사용하여 직접 값을 가져옴
    const emailLocal = document.getElementById('signupEmailLocal').value;
    const emailDomain = document.getElementById('signupEmailDomain').value;
    const studentId = document.getElementById('signupStudentId').value;
    const name = document.getElementById('signupName').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    // 비밀번호 확인
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    // 데이터 유효성 검사
    if (!emailLocal || !emailDomain || !studentId || !name || !password) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                emailLocal,
                emailDomain,
                studentId,
                name,
                password
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '회원가입 실패');
        }

        alert('회원가입이 완료되었습니다.');
        showLoginForm(); // 로그인 폼으로 돌아가기
    } catch (error) {
        alert(error.message);
        console.error('회원가입 오류:', error);
    }
}

// 페이지 로드 시 애니메이션 처리
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const contents = document.querySelectorAll('.content');
    contents.forEach(content => observer.observe(content));
});

// 이메일 입력 필드에 대한 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('signupEmailLocal');
    
    // 입력 시 영문, 숫자 외 문자 제거
    emailInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
    });
}); 