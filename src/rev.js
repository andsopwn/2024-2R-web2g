// 페이지별 기능을 처리하는 JavaScript 코드

function toggleSeat(seatElement) {
    seatElement.classList.toggle('selected');
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
        // 현재 페이지가 좌석예약인지 공��예약인지 확인
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
            const response = await fetch('/api/reservations', {
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

            alert(`예약이 완료되었습니다!\n\n` + 
                `예약자: ${studentName}(${studentId})\n` +
                `건물: ${building}\n` +
                `층: ${floor}\n` +
                `호실: ${room}\n` +
                `날짜: ${date}\n` +
                `시간: ${startTime} - ${endTime}`);
            
            window.location.href = 'my_reservation.html';
            
        } catch (error) {
            console.error('Error:', error);
            alert('예약 처리 중 오류가 발생했습니다.');
        }
    } else {
        alert('모든 항목을 입력해주세요.');
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
    } else {
        alert("모든 항목을 선택하고 좌석을 선택해주세요.");
    }
}

// 예약 정보 불러오기
async function loadReservations() {
    const studentId = sessionStorage.getItem('studentId');
    const studentName = sessionStorage.getItem('studentName');

    try {
        const response = await fetch(`/api/reservations?studentId=${studentId}&studentName=${studentName}`, {
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
    if (!reservationList) return;
    
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
async function cancelReservation(reservationId) {
    if (!confirm('예약을 취소하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`/api/reservations/${reservationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('예약 취소 실패');
        }

        alert('예약이 취소되었습니다.');
        loadReservations();
    } catch (error) {
        console.error('Error:', error);
        alert('예약 취소에 실패했습니다.');
    }
}

// 캠퍼스 맵 관련 함수 추가
function switchCampus(campusId) {
    // 모든 맵 숨기기
    document.getElementById('sejong-map').style.display = 'none';
    document.getElementById('seoul-map').style.display = 'none';
    document.getElementById('shared-map').style.display = 'none';
    
    // 선택된 캠퍼스 맵 보이기
    document.getElementById(`${campusId}-map`).style.display = 'block';
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.campus-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchCampus('${campusId}')"]`).classList.add('active');
}

// 건물 클릭 이벤트 처리
function showBuilding(buildingName) {
    // 건물 선택 시 select 박스 값 변경
    const buildingSelect = document.getElementById('building');
    if (buildingSelect) {
        buildingSelect.value = buildingName;
        updateFloors(); // 층수 업데이트 트리거
    }
    
    // 알림 표시
    alert(`${buildingName}이(가) 선택되었습니다.`);
}


document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('reservationList')) {
        loadReservations();
    }

    if (document.getElementById('sejong-map')) {
        switchCampus('sejong');
    }
    
    // 건물 선택 이벤트 리스너 추가
    const buildingSelect = document.getElementById('building');
    if (buildingSelect) {
        buildingSelect.addEventListener('change', updateFloors);
    }
    
    // 층 선택 이벤트 리스너 추가
    const floorSelect = document.getElementById('floor');
    if (floorSelect) {
        floorSelect.addEventListener('change', updateRooms);
    }
    
    // 호실 선택 이벤트 리스너 추가
    const roomSelect = document.getElementById('room');
    if (roomSelect) {
        roomSelect.addEventListener('change', loadSeats);
    }
});