// 페이지별 기능을 처리하는 JavaScript 코드

function toggleSeat(seatElement) {
    seatElement.classList.toggle('selected');
}

// 건물 목록을 가져오는 함수
async function loadBuildings() {
    try {
        const response = await fetch('/api/buildings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('건물 목록을 가져오는데 실패했습니다.');
        }

        const buildings = await response.json();
            console.log('받아온 건물 데이터:', buildings); // 디버깅용 로그

        const buildingSelect = document.getElementById('building');
        buildingSelect.innerHTML = '<option value="">건물을 선택하세요</option>';
        
        buildings.forEach(building => {
            const option = document.createElement('option');
            option.value = building.building_id;
            option.textContent = building.name;
            buildingSelect.appendChild(option);
        });
    } catch (error) {
        console.error('건물 목록 로딩 실패:', error);
        alert('건물 목록을 불러오는데 실패했습니다.');
    }
}

// 선택된 건물의 층 옵션을 업데이트하는 함수
async function updateFloors() {
    const buildingId = document.getElementById('building').value;
    const floorSelect = document.getElementById('floor');
    
    // 초기화
    floorSelect.innerHTML = '<option value="">층을 선택하세요</option>';
    
    if (!buildingId) return;

    try {
        console.log('선택된 건물 ID:', buildingId); // 디버깅용

        const response = await fetch(`/api/buildings/${buildingId}`);
        if (!response.ok) {
            throw new Error('건물 정보를 가져오는데 실패했습니다.');
        }

        const building = await response.json();
        console.log('받아온 건물 정보:', building); // 디버깅용

        // 지하층 옵션 추가 (있는 경우)
        if (building.basement_floors > 0) {
            for (let i = building.basement_floors; i > 0; i--) {
                const option = document.createElement('option');
                option.value = `B${i}`;
                option.textContent = `B${i}층`;
                floorSelect.appendChild(option);
            }
        }
        
        // 지상층 옵션 추가
        for (let i = 1; i <= building.ground_floors; i++) {
            const option = document.createElement('option');
            option.value = `${i}`;
            option.textContent = `${i}층`;
            floorSelect.appendChild(option);
        }
    } catch (error) {
        console.error('층 정보 로딩 실패:', error);
        alert('층 정보를 불러오는데 실패했습니다.');
    }
}

// 선택된 층의 호실 목록을 업데이트하는 함수
async function updateRooms() {
    const buildingId = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    const roomSelect = document.getElementById('room');
    
    // 초기화
    roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
    
    if (!buildingId || !floor) return;

    try {
        const response = await fetch(`/api/rooms/${buildingId}/${floor}`);
        if (!response.ok) {
            throw new Error('호실 정보를 가져오는데 실패했습니다.');
        }

        const rooms = await response.json();
        console.log('받아온 호실 데이터:', rooms); // 디버깅용
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            
            let statusText = '예약 가능';
            option.className = 'status-available';
            
            if (room.status === 'occupied') {
                statusText = '예약 불가';
                option.className = 'status-occupied';
                option.disabled = true;
            } else if (room.status === 'maintenance') {
                statusText = '점검 중';
                option.className = 'status-maintenance';
                option.disabled = true;
            }
            
            option.textContent = `${room.room_number} (${statusText})`;
            if (room.capacity) {
                option.textContent += ` - 수용인원: ${room.capacity}명`;
            }
            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('호실 목록 로딩 실패:', error);
        alert('호실 목록을 불러오는데 실패했습니다.');
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
//시간 선택 유효성 검사
function validateTimeSelection() {
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    if (!startTime || !endTime) {
        alert('시작 시간과 종료 시간을 모두 선택해주세요.');
        return false;
    }
    
    // 시작 시간이 종료 시간보다 늦은 경우
    if (startTime >= endTime) {
        alert('종료 시간은 시작 시간보다 늦어야 합니다.');
        return false;
    }
    
    return true;
}

async function reserveSpace() {
    if (!validateTimeSelection()) {
        return;
    }
}

async function reserveSpace() {
    // 필수 입력값 검증
    const roomId = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!roomId || !date || !startTime || !endTime) {
        alert('모든 항목을 선택해주세요.');
        return;
    }

    // 시간 유효성 검사
    if (!validateTimeSelection()) {
        return;
    }

    try {
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
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '예약 처리 중 오류가 발생했습니다.');
        }

        alert('예약이 완료되었습니다.');
        window.location.href = 'my_reservation.html';

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
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
        buildingSelect.value = buildingId;
        // change 이벤트만 발생시키고, API 호출은 updateFloors에서 한 번만 하도록 함
        buildingSelect.dispatchEvent(new Event('change'));
    }
    // 알림 표시
    alert(`${buildingName}이(가) 선택되었습니다.`);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 예약 목록 로드 (my_reservation.html)
    if (document.getElementById('reservationList')) {
        loadReservations();
    }

    // 캠퍼스 맵 초기화
    if (document.getElementById('sejong-map')) {
        switchCampus('sejong');
    }

    // 공간 예약 관련 초기화 (space_reservation.html)
    const buildingSelect = document.getElementById('building');
    const floorSelect = document.getElementById('floor');
    const roomSelect = document.getElementById('room');

    // 건물 선택 관련
    if (buildingSelect) {
        // 건물 목록 로드
        loadBuildings();
        
        // 건물 선택 시 층 업데이트
        buildingSelect.addEventListener('change', function() {
            console.log('건물 선택 변경됨:', this.value);
            updateFloors();
        });
    }
    
    // 층 선택 관련
    if (floorSelect) {
        floorSelect.addEventListener('change', function() {
            console.log('층 선택 변경됨:', this.value);
            updateRooms();
        });
    }
    
    // 호실 선택 관련
    if (roomSelect) {
        roomSelect.addEventListener('change', loadSeats);
    }
});