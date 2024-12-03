// 페이지별 기능을 처리하는 JavaScript 코드
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
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    // 초기화
    roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
    
    if (!buildingId || !floor) return;

    try {
        console.log('API 요청:', `/api/rooms/${buildingId}/${floor}?date=${date}&startTime=${startTime}&endTime=${endTime}`);
        const response = await fetch(`/api/rooms/${buildingId}/${floor}?date=${date}&startTime=${startTime}&endTime=${endTime}`);
        
        if (!response.ok) {
            throw new Error('호실 정보를 가져오는데 실패했습니다.');
        }

        const rooms = await response.json();
        console.log('받아온 호실 데이터:', rooms); // 디버깅용
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = room.room_number;
            
            if (room.is_reserved) {
                option.disabled = true;
                option.textContent += ' (예약됨)';
            }
            
            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('호실 목록 로딩 실패:', error);
        alert('호실 목록을 불러오는데 실패했습니다.');
    }
}

// seat_reservation.html용
async function updateRoomsForSeats() {
    const buildingId = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    const roomSelect = document.getElementById('room');
    
    roomSelect.innerHTML = '<option value="">호실을 선택하세요</option>';
    
    if (!buildingId || !floor) return;

    try {
        const response = await fetch(`/api/rooms/${buildingId}/${floor}`);
        if (!response.ok) {
            throw new Error('호실 정보를 가져오는데 실패했습니다.');
        }

        const rooms = await response.json();
        
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = room.room_number;
            if (room.capacity) {
                option.textContent += ` - 수용인원: ${room.capacity}명`;
            }
            roomSelect.appendChild(option);
        });

        // 이벤트 리스너 중복 등록 방지
        roomSelect.removeEventListener('change', loadSeats);
        roomSelect.addEventListener('change', loadSeats);

    } catch (error) {
        console.error('호실 목록 로딩 실패:', error);
        alert('호실 목록을 불러오는데 실패했습니다.');
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
    try {
        // 입력값 가져오기
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const room = document.getElementById('room').value;
        const studentId = document.getElementById('currentUser').textContent;

        // 디버깅을 위한 로그
        console.log('예약 데이터:', {
            studentId,
            date,
            startTime,
            endTime,
            room
        });

        // 입력값 검증
        if (!date || !startTime || !endTime || !room || !studentId) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const response = await fetch('/api/reserve-space', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,  // snake_case로 변경
                reservation_date: date,  // 컬럼명과 일치하도록 변경
                start_time: startTime,
                end_time: endTime,
                room_id: room,          // room_id로 변경
                status: '예약불가'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '예약 처리 중 오류가 발생했습니다.');
        }

        const data = await response.json();

        if (data.success) {
            alert('예약이 완료되었습니다.');
            window.location.href = 'main.html';
        } else {
            alert(data.message || '예약 중 오류가 발생했습니다.');
        }

    } catch (error) {
        console.error('예약 처리 중 오류:', error);
        alert(error.message || '예약 처리 중 오류가 발생했습니다.');
    }
}

async function loadSeats() {
    try {
        const roomId = document.getElementById('room').value;
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const seatsContainer = document.getElementById('seats-container');

        if (!roomId || !date || !startTime || !endTime || !seatsContainer) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 선택된 호실의 좌석 정보 가져오기
        const response = await fetch(`/api/seats/${roomId}`);
        if (!response.ok) {
            throw new Error('좌석 정보를 가져오는데 실패했습니다.');
        }

        const data = await response.json();

        seatsContainer.innerHTML = '';
        seatsContainer.style.display = 'grid';
        seatsContainer.style.gridTemplateColumns = `repeat(${data.maxCol}, 1fr)`;
        seatsContainer.style.gap = '10px';

        for (let i = 1; i <= data.maxRow; i++) {
            for (let j = 1; j <= data.maxCol; j++) {
                const seat = data.seats.find(s => s.row_num === i && s.col_num === j);
                
                const seatDiv = document.createElement('div');
                seatDiv.className = 'seat';
                
                if (seat) {
                    seatDiv.dataset.seatId = seat.seat_id;
                    seatDiv.textContent = `${String.fromCharCode(64 + i)}${j}`;
                    
                    if (seat.is_reserved) {
                        seatDiv.classList.add('reserved');    // 빨간색
                    } else {
                        seatDiv.classList.add('available');   // 초록색
                        seatDiv.onclick = () => toggleSeatSelection(seatDiv);
                    }
                } else {
                    seatDiv.classList.add('disabled');
                }
                
                seatsContainer.appendChild(seatDiv);
            }
        }
    } catch (error) {
        console.error('좌석 로딩 오류:', error);
        alert('좌석 정보를 불러오는데 실패했습니다.');
    }
}

// 좌석 선택 토글
function toggleSeatSelection(seatDiv) {
    // 이미 선택된 좌석이 있는지 확인
    const selectedSeat = document.querySelector('.seat.selected');
    
    // 현재 클릭한 좌석이 이미 선택된 좌석인 경우
    if (seatDiv.classList.contains('selected')) {
        seatDiv.classList.remove('selected');
    } 
    // 다른 좌석이 선택되어 있는 경우
    else if (selectedSeat) {
        selectedSeat.classList.remove('selected');
        seatDiv.classList.add('selected');
    }
    // 선택된 좌석이 없는 경우
    else {
        seatDiv.classList.add('selected');
    }

    // 선택된 좌석 정보 업데이트
    const selectedSeatId = document.getElementById('selected-seat-id');
    if (selectedSeatId) {
        selectedSeatId.value = seatDiv.classList.contains('selected') ? seatDiv.dataset.seatId : '';
    }
}

// 좌석 예약
async function reserveSeat() {
    try {
        // 1. 좌석 선택 확인
        const selectedSeat = document.querySelector('.seat.selected');
        console.log('선택된 좌석:', selectedSeat); // 디버깅
        if (!selectedSeat) {
            alert('좌석을 선택해주세요.');
            return;
        }

        // 2. 입력값 가져오기
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const seatId = selectedSeat.dataset.seatId;
        const studentId = document.getElementById('currentUser').textContent;

        // 디버깅: 각 입력값 확인
        console.log('입력값 확인:', {
            date,
            startTime,
            endTime,
            seatId,
            studentId
        });

        if (!date || !startTime || !endTime || !seatId || !studentId) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 3. API 요청
        const requestBody = {
            student_id: studentId,
            reservation_date: date,
            start_time: startTime,
            end_time: endTime,
            seat_id: seatId,
            status: '예약불가'
        };
        
        console.log('API 요청 데이터:', requestBody); // 디버깅

        const response = await fetch('/api/reserve-seat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '좌석 예약 처리 중 오류가 발생했습니다.');
        }

        const data = await response.json();
        console.log('API 응답:', data); // 디버깅

        if (data.success) {
            alert('좌석 예약이 완료되었습니다.');
            window.location.href = 'main.html';
        } else {
            alert(data.message || '좌석 예약 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('좌석 예약 처리 중 오류:', error);
        alert(error.message || '좌석 예약 처리 중 오류가 발생했습니다.');
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
    // 호실 선택 관련
    if (floorSelect) {
        // space_reservation.html의 경우
        if (document.querySelector('.space-reservation')) {
            floorSelect.addEventListener('change', updateRooms);
        }
        
        // seat_reservation.html의 경우
        if (document.querySelector('.seat-reservation')) {
            floorSelect.addEventListener('change', updateRoomsForSeats);
            // 좌석 예약 페이지에서만 loadSeats 이벤트 리스너 추가
            if (roomSelect) {
                roomSelect.addEventListener('change', loadSeats);
            }
        }
    }
});