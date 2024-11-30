// 사용자 정보 표시 함수
function displayUserInfo() {
    const studentId = sessionStorage.getItem('studentId');
    if (studentId) {
        document.getElementById('currentUser').textContent = studentId;
    }
}

// 로그아웃 처리 함수
async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            sessionStorage.clear();
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
}


async function checkSession() {
    try {
        const response = await fetch('/api/check-session', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.isLoggedIn) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('세션 체크 오류:', error);
        window.location.href = '/login';
    }
}


// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // checkSession(); // 세션 체크 비활성화
    displayUserInfo();
}); 