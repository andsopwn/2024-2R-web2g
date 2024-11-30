// 페이지별 기능을 처리하는 JavaScript 코드

function toggleSeat(seatElement) {
    seatElement.classList.toggle('selected');
}
//로그인 처리
function handleLogin(event) {
    event.preventDefault(); // 폼 기본 제출 동작 방지
    
    const studentId = document.getElementById('studentId').value;
    const studentName = document.getElementById('studentName').value;
    
    // 학번 형식 검증 (10자리 숫자)
    if (!/^\d{10}$/.test(studentId)) {
        alert('올바른 학번을 입력해주세요 (10자리 숫자)');
        return;
    }
    
    // 세션에 사용자 정보 저장
    sessionStorage.setItem('studentId', studentId);
    sessionStorage.setItem('studentName', studentName);
    
    // 메인 페이지로 이동
    window.location.href = 'main.html';
}

// 건물별 층수 정보
const buildingFloors = {
    '과학기술1관': 8,
    '과학기술2관': 6,
    // 다른 건물들 추가
};

function updateFloors() {
    const building = document.getElementById('building').value;
    const floorSelect = document.getElementById('floor');
    floorSelect.innerHTML = '<option value="">층을 선택하세요</option>';
    
    if (building) {
        const maxFloor = buildingFloors[building];
        for (let i = 1; i <= maxFloor; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}층`;
            floorSelect.appendChild(option);
        }
    }
}

function updateRooms() {
    const floor = document.getElementById('floor').value;
    const roomSelect = document.getElementById('room');
    roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
    
    if (floor) {
        // 현재 페이지가 좌석예약인지 공간예약인지 확인
        const isSpaceReservation = window.location.pathname.includes('space_reservation');
        const start = isSpaceReservation ? 1 : 2; // 홀수/짝수 구분
        
        for (let i = start; i <= 50; i += 2) {
            const roomNumber = `${floor}${i.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = roomNumber;
            option.textContent = `${roomNumber}호`;
            roomSelect.appendChild(option);
        }
    }
}

function loadSeats() {
    const seatGrid = document.getElementById('seatGrid');
    if (!seatGrid) return;
    
    seatGrid.innerHTML = '';
    
    // 10x8 좌석 배열 생성
    for (let i = 0; i < 80; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.textContent = `${Math.floor(i/10)+1}-${i%10+1}`;
        seat.onclick = () => toggleSeat(seat);
        seatGrid.appendChild(seat);
    }
}

async function reserveSpace() {
    const building = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const studentId = sessionStorage.getItem('studentId');
    const studentName = sessionStorage.getItem('studentName');

    if (building && floor && room && date && startTime && endTime) {
        try {
            const response = await fetch('http://localhost:3000/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    building,
                    floor,
                    room,
                    date,
                    startTime,
                    endTime,
                    studentId,
                    studentName,
                    reservationType: 'space'
                })
            });

            if (!response.ok) {
                throw new Error('예약 실패');
            }

            // 예약 정보를 alert으로 출력
            alert(`예약이 완료되었습니다!\n\n` + 
                `예약자: ${studentName}(${studentId})\n` +
                `건물: ${building}\n` +
                `층: ${floor}\n` +
                `호실: ${room}\n` +
                `날짜: ${date}\n` +
                `시간: ${startTime} - ${endTime}`);            // 예약 완료 후 my_reservation.html로 이동
            window.location.href = 'my_reservation.html';
            
        } catch (error) {
            console.error('Error:', error);
            alert('예약 처리 중 오류가 발생했습니다.');
        }
    } else {
        alert('모든 항목을 입력해주세요.');
    }
}

//서버로 공간예약 전송
function SpaceServer() {
    const building = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (building && floor && room && date && startTime && endTime) {
        // 예약 데이터 객체 생성
        const reservationData = {
            building,
            floor,
            room,
            date,
            startTime,
            endTime,
            studentInfo: {
                id: studentId,
                name: studentName
            },
            reservationType: 'space',
            createdAt: new Date().toISOString()
        };

        // 서버로 데이터 전송
        fetch('/api/reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('예약 저장에 실패했습니다');
            }
            return response.json();
        })
        .then(data => {
            alert(`${building} ${room}호 공간이 ${date} ${startTime}부터 ${endTime}까지 예약되었습니다.`);
            location.href = 'my_reservations.html';
        })
        .catch(error => {
            alert('예약 처리 중 오류가 발생했습니다: ' + error.message);
        });
    } else {
        alert("모든 항목을 선택해주세요.");
    }
}


function reserveSeats() {
    const building = document.getElementById('building').value;
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const selectedSeats = document.querySelectorAll('.seat.selected');

    if (building && room && date && startTime && endTime && selectedSeats.length > 0) {
        const seatNumbers = Array.from(selectedSeats).map(seat => seat.textContent);
        alert(`${building} ${room}호의 좌석 ${seatNumbers.join(', ')}이(가) ${date} ${startTime}부터 ${endTime}까지 예약되었습니다.`);
        location.href = 'my_reservations.html';
        //예약 내역 저장 필요
    } else {
        alert("모든 항목을 선택하고 좌석을 선택해주세요.");
    }
}
//서버로 좌석예약 전송
function SeatsServer() {
    const building = document.getElementById('building').value;
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const selectedSeats = document.querySelectorAll('.seat.selected');

    if (building && room && date && startTime && endTime && selectedSeats.length > 0) {
        const seatNumbers = Array.from(selectedSeats).map(seat => seat.textContent);
        
        // 예약 데이터 객체 생성
        const reservationData = {
            building,
            room,
            date,
            startTime,
            endTime,
            seats: seatNumbers,
            studentInfo: {
                id: studentId,
                name: studentName
            },
            reservationType: 'seat',
            createdAt: new Date().toISOString()
        };

        // 서버로 데이터 전송
        fetch('/api/seat-reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservationData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('좌석 예약 저장에 실패했습니다');
            }
            return response.json();
        })
        .then(data => {
            alert(`${building} ${room}호의 좌석 ${seatNumbers.join(', ')}이(가) ${date} ${startTime}부터 ${endTime}까지 예약되었습니다.`);
            location.href = 'my_reservations.html';
        })
        .catch(error => {
            alert('예약 처리 중 오류가 발생했습니다: ' + error.message);
        });
    } else {
        alert("모든 항목을 선택하고 좌석을 선택해주세요.");
    }
}

// 페이지 로드 시 예약 정보 불러오기
document.addEventListener('DOMContentLoaded', function() {
    loadReservations();
});

// 예약 정보 불러오기
async function loadReservations() {
    const studentId = sessionStorage.getItem('studentId');
    const studentName = sessionStorage.getItem('studentName');

    if (!studentId || !studentName) {
        alert('로그인이 필요합니다.');
        location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/reservations?studentId=${studentId}&studentName=${studentName}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }

        const data = await response.json();
        displayReservations(data);
    } catch (error) {
        console.error('Error:', error);
        alert('예약 정보를 불러오는데 실패했습니다.');
    }
}

// 예약 정보 화면에 표시
function displayReservations(reservations) {
    const reservationList = document.getElementById('reservationList');
    reservationList.innerHTML = '';

    if (reservations.length === 0) {
        reservationList.innerHTML = '<p class="no-reservations">예약 내역이 없습니다.</p>';
        return;
    }

    reservations.forEach(reservation => {
        const reservationItem = document.createElement('div');
        reservationItem.className = 'reservation-item';
        
        const date = new Date(reservation.date);
        const formattedDate = date.toLocaleDateString('ko-KR');

        reservationItem.innerHTML = `
            <div class="reservation-header">
                <h3>${reservation.building} ${reservation.room}호</h3>
                <span class="reservation-type">${reservation.reservation_type}</span>
            </div>
            <div class="reservation-details">
                <p>날짜: ${formattedDate}</p>
                <p>시간: ${reservation.start_time} - ${reservation.end_time}</p>
                ${reservation.seats ? `<p>좌석: ${reservation.seats}</p>` : ''}
            </div>
            <div class="reservation-actions">
                <button onclick="cancelReservation(${reservation.id})" class="btn-cancel">예약 취소</button>
            </div>
        `;
        
        reservationList.appendChild(reservationItem);
    });
}

// 예약 취소
function cancelReservation(reservationId) {
    if (!confirm('예약을 취소하시겠습니까?')) {
        return;
    }

    fetch('cancel_reservation.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('예약이 취소되었습니다.');
            loadReservations();
        } else {
            throw new Error(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('예약 취소에 실패했습니다.');
    });
}

// 페이지 로드 시 세션 체크
async function checkSession() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (!data.isLoggedIn) {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('세션 체크 오류:', error);
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', checkSession);