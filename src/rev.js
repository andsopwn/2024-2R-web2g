// 페이지별 기능을 처리하는 JavaScript 코드
console.log('rev.js loaded'); // 파일이 로드되는지 확인하기 위한 로그
function toggleSeat(seatElement) {
    seatElement.classList.toggle('selected');
}

// 페이지 로드 시 건물 목록을 불러오는 함수
async function loadBuildingOptions() {
    try {
        console.log('건물 목록 로딩 시작');
        
        const response = await fetch('/api/buildings');
        if (!response.ok) {
            throw new Error('건물 목록 로딩 실패');
        }
        const buildings = await response.json();
        
        console.log('서버에서 받은 건물 데이터:', buildings);
        
        const buildingSelect = document.getElementById('building');
        buildingSelect.innerHTML = '<option value="">건물을 선택하세요</option>';
        
        buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building.building_id;
            option.textContent = building.name;
            buildingSelect.appendChild(option);
        });
        
        console.log('건물 목록 로딩 완료');
    } catch (error) {
        console.error('건물 목록 로딩 실패:', error);
    }
}

// 건물 선택 시 층 목록을 불러오는 함수
async function updateFloors() {
    const buildingId = document.getElementById('building').value;
    if (!buildingId) {
        const floorSelect = document.getElementById('floor');
        floorSelect.innerHTML = '<option value="">층을 선택하세요</option>';
        return;
    }

    try {
        const response = await fetch(`/api/buildings/${buildingId}/floors`);
        if (!response.ok) {
            throw new Error('층 목록 로딩 실패');
        }
        const floors = await response.json();
        
        const floorSelect = document.getElementById('floor');
        floorSelect.innerHTML = '<option value="">층을 선택하세요</option>';
        
        floors.forEach(floor => {
            const option = document.createElement('option');
            option.value = floor.floor;
            option.textContent = `${floor.floor}층`;
            floorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('층 목록 로딩 실패:', error);
    }
}

// 층 선택 시 호실 목록을 불러오는 함수
async function updateRooms() {
    const buildingId = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    
    if (!buildingId || !floor) {
        const roomSelect = document.getElementById('room');
        roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
        return;
    }

    try {
        const response = await fetch(`/api/rooms/${buildingId}/${floor}`);
        if (!response.ok) {
            throw new Error('호실 목록 로딩 실패');
        }
        const rooms = await response.json();
        
        const roomSelect = document.getElementById('room');
        roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = `${room.room_number}호 (${room.capacity}명, ${room.room_type})`;
            option.style.backgroundColor = room.status === 'available' ? '#ccffcc' : '#ffcccc';
            
            if (room.status !== 'available') {
                option.disabled = true;
                option.textContent += ` - ${room.status === 'occupied' ? '사용 중' : '점검 중'}`;
            }
            
            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('호실 목록 로딩 실패:', error);
    }
}

// 중복 제출 방지를 위한 플래그
let isSubmitting = false;

async function submitReservation() {
    // 이미 제출 중이면 return
    if (isSubmitting) {
        console.log('이미 제출 중입니다.');
        return;
    }

    try {
        isSubmitting = true; // 제출 시작
        
        // 필요한 값들을 가져옴
        const roomId = document.getElementById('room').value;
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        console.log('예약 요청 데이터:', { roomId, date, startTime, endTime });
        
        // 입력값 검증
        if (!roomId || !date || !startTime || !endTime) {
            alert('모든 필수 항목을 입력해주세요.');
            return;
        }

        const response = await fetch('/api/room-reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId,
                date,
                startTime,
                endTime
            }),
            credentials: 'include'
        });

        console.log('서버 응답 상태:', response.status);
        const data = await response.json();
        console.log('서버 응답 데이터:', data);
        
        if (!response.ok) {
            throw new Error(data.error || '예약 처리 중 오류가 발생했습니다.');
        }

        alert('예약이 성공적으로 완료되었습니다!');
        window.location.href = '/my_reservation.html';
        
    } catch (error) {
        alert('예약 실패: ' + error.message);
        console.error('예약 오류:', error);
    } finally {
        isSubmitting = false; // 제출 완료
    }
}


// 페이지 로드 시 건물 정보 로딩
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

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // DOM이 로드되었는지 확인
    
    // 예약 목록 로드 (my_reservation.html)
    if (document.getElementById('reservationList')) {
        loadReservations();
    }

    // 캠퍼스 맵 초기화
    if (document.getElementById('sejong-map')) {
        switchCampus('sejong');
    }
    
    // 초기 건물 목록 로드
    loadBuildingOptions();
    
    // 폼 관련 이벤트 리스너들
    const form = document.getElementById('reservationForm');
    if (form) {
        // onsubmit 속성 제거하고 이벤트 리스너로 처리
        form.removeAttribute('onsubmit');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            submitReservation();
        });
        
        // 예약하기 버튼 비활성화 처리
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.addEventListener('click', function(event) {
                if (isSubmitting) {
                    event.preventDefault();
                }
            });
        }
    }
    
    // 선택 필드 이벤트 리스너들
    const buildingSelect = document.getElementById('building');
    if (buildingSelect) {
        buildingSelect.addEventListener('change', () => {
            updateFloors();
            updateRooms(); // 건물이 변경되면 호실 목록도 초기화
        });
    }
    
    const floorSelect = document.getElementById('floor');
    if (floorSelect) {
        floorSelect.addEventListener('change', updateRooms);
    }
    
    const roomSelect = document.getElementById('room');
    if (roomSelect) {
        roomSelect.addEventListener('change', loadSeats);
    }
});