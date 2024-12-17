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

        const rooms = await response.json(); // 서버에서 받아온 데이터
        console.log('받아온 호실 데이터:', rooms); // 디버깅용
        // 받아온 데이터로 호실 선택 리스트 업데이트
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = room.room_number;

            // `room_reserved`가 1인 경우 비활성화
            if (room.room_reserved) {
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
//좌석예약 페이즈 호실 업데이트
async function updateRoomForSeats() {
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

        const rooms = await response.json(); // 서버에서 받아온 데이터
        console.log('받아온 호실 데이터:', rooms); // 디버깅용
        // 받아온 데이터로 호실 선택 리스트 업데이트
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.room_id;
            option.textContent = room.room_number;

            roomSelect.appendChild(option);
        });
    } catch (error) {
        console.error('호실 목록 로딩 실패:', error);
        alert('호실 목록을 불러오는데 실패했습니다.');
    }
}
//좌석 선택 업데이트
async function updateSeats() {
    const roomId = document.getElementById('room').value; // 선택된 호실 ID
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const seatGrid = document.getElementById('seatGrid'); // 좌석을 표시할 그리드

    if (!roomId) return;

    // 좌석 그리드 초기화
    seatGrid.innerHTML = ''; // 기존 좌석 데이터를 초기화

    try {
        // 좌석 정보 API 요청
        const response = await fetch(`/api/seats/${roomId}?reservationDate=${date}&startTime=${startTime}&endTime=${endTime}`);

        if (!response.ok) {
            throw new Error('좌석 정보를 가져오는데 실패했습니다.');
        }

        const seatsData = await response.json(); // 서버에서 받아온 좌석 데이터

        // 데이터 유효성 검사
        if (!seatsData || !Array.isArray(seatsData)) {
            console.log('유효한 좌석 데이터가 없습니다.');
            return;
        }

        // 좌석 데이터를 행과 열로 그룹화
        const rows = {};
        seatsData.forEach(seat => {
            if (!rows[seat.row_num]) {
                rows[seat.row_num] = [];
            }
            rows[seat.row_num][seat.col_num] = seat;
        });

        // 각 행별로 좌석 생성
        Object.keys(rows).forEach(rowNum => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';  // 각 행의 클래스 설정

            // 각 열별로 좌석 생성
            Object.keys(rows[rowNum]).forEach(colNum => {
                const seat = rows[rowNum][colNum];
                const seatDiv = document.createElement('div');
                seatDiv.dataset.seatId = seat.seat_id;
                seatDiv.textContent = `${rowNum}-${colNum}`;  // 좌석 번호 표시

                // 예약된 좌석은 비활성화 처리
                if (seat.seat_reserved) {
                    seatDiv.classList.add('reserved');  // 예약된 좌석에 스타일 추가
                    seatDiv.classList.add('disabled');  // 클릭할 수 없도록 비활성화
                } else {
                    // 예약되지 않은 좌석 클릭 시 선택 가능
                    seatDiv.classList.add('available');  // 선택 가능한 좌석에 스타일 추가
                    seatDiv.addEventListener('click', function() {
                        const previousSelected = document.querySelector('.seat.selected');
                        if (previousSelected) {
                            previousSelected.classList.remove('selected');
                        }
                        this.classList.add('selected');
                    });
                }

                // 각 좌석을 행에 추가
                rowDiv.appendChild(seatDiv);
            });

            // 각 행을 좌석 그리드에 추가
            seatGrid.appendChild(rowDiv);
        });

    } catch (error) {
        console.error('좌석 목록 로딩 실패:', error);
        alert('좌석 목록을 불러오는데 실패했습니다.');
    }
}

// 좌석 그리드 출력
async function displaySeats() {
    try {
        const seatsData = await loadSeats();
        console.log('받아온 좌석 데이터:', seatsData);

        // 데이터 유효성 검사
        if (!seatsData || !Array.isArray(seatsData)) {
            console.log('유효한 좌석 데이터가 없습니다.');
            return;
        }

        const seatGrid = document.getElementById('seatGrid');
        if (!seatGrid) {
            console.error('seatGrid 요소를 찾을 수 없습니다.');
            return;
        }

        seatGrid.innerHTML = ''; // 기존 좌석 그리드 초기화

        // 좌석 데이터를 행과 열로 구성
        const rows = {};
        seatsData.forEach(seat => {
            if (!rows[seat.row_num]) {
                rows[seat.row_num] = [];
            }
            rows[seat.row_num][seat.col_num] = seat;
        });

        // 각 행별로 좌석 생성
        Object.keys(rows).forEach(rowNum => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            // 각 열의 좌석 생성
            Object.keys(rows[rowNum]).forEach(colNum => {
                const seat = rows[rowNum][colNum];
                const seatDiv = document.createElement('div');
                seatDiv.className = `seat ${seat.seat_reserved ? 'reserved' : 'available'}`;
                seatDiv.dataset.seatId = seat.seat_id;
                seatDiv.textContent = `${rowNum}-${colNum}`;

                // 좌석 클릭 이벤트 추가
                if (!seat.seat_reserved) { // 예약된 좌석은 이벤트 제외
                    seatDiv.addEventListener('click', function() {
                        toggleSeatSelection(seatDiv);
                    });
                }

                rowDiv.appendChild(seatDiv);
            });

            seatGrid.appendChild(rowDiv);
        });

    } catch (error) {
        console.error('좌석 그리드 생성 중 오류:', error);
    }
}
// 좌석 선택 토글
function toggleSeatSelection(seatDiv) {
    // 선택된 좌석인지 확인
    if (seatDiv.classList.contains('selected')) {
        // 선택 해제
        seatDiv.classList.remove('selected');
    } else {
        // 다른 선택된 좌석이 있는 경우 해제
        const selectedSeat = document.querySelector('.seat.selected');
        if (selectedSeat) {
            selectedSeat.classList.remove('selected');
        }
        // 현재 좌석 선택
        seatDiv.classList.add('selected');
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

        const response = await fetch('/api/room-reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                reservation_date: date,
                start_time: startTime,
                end_time: endTime,
                room_id: room,
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

function numberToAlphabet(num) {
    return String.fromCharCode(64 + num);
}
  

async function loadSeats() {
    try {
        const roomId = document.getElementById('room').value;
        console.log('요청하는 roomId:', roomId);

        if (!roomId) {
            console.log('방이 선택되지 않았습니다.');
            return [];
        }

        const response = await fetch(`/api/seats/${roomId}`);
        console.log('API 요청 URL:', `/api/seats/${roomId}`);
        
        if (!response.ok) {
            throw new Error('서버 응답이 올바르지 않습니다.');
        }

        const seatsData = await response.json();
        console.log('받아온 좌석 데이터:', seatsData);

        // 데이터가 배열인지 확인
        if (!Array.isArray(seatsData)) {
            console.log('좌석 데이터가 배열이 아닙니다.');
            return [];
        }

        return seatsData;
    } catch (error) {
        console.error('좌석 데이터를 불러오는 중 오류:', error);
        return [];
    }
}

// 좌석 예약
async function reserveSeat() {
    try {
        const selectedSeat = document.querySelector('.seat.selected');
        const seatId = selectedSeat.dataset.seatId;
        const studentId = document.getElementById('currentUser').textContent;
        const roomId = document.getElementById('room').value;
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        //선택된 좌석이 없을 때
        if (!selectedSeat) {
            alert('좌석을 선택해주세요.');
            return;
        }
        // 데이터 유효성 검사
        if (!seatId || !studentId || !roomId|| !date || !startTime || !endTime) {
            console.log('예약 데이터:', { seatId, studentId, roomId, date, startTime, endTime });
            alert('모든 예약 정보를 입력해주세요.');
            return;
        }

        const response = await fetch('/api/seat-reservations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                seat_id: seatId,
                student_id: studentId,
                room_id: roomId,
                reservation_date: date,
                start_time: startTime,
                end_time: endTime,
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '예약 처리 중 오류가 발생했습니다.');
        }

        const result = await response.json();
        alert('예약이 완료되었습니다.');
        
        // 예약 완료 후 my_reservation.html로 이동
        window.location.href = '/my_reservation.html';
        
    } catch (error) {
        console.error('예약 처리 중 오류:', error);
        alert(error.message);
    }
}


// 예약하기 버튼에 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    const reserveButton = document.querySelector('.reserve-button');
    if (reserveButton) {
        reserveButton.addEventListener('click', reserveSeat);
    }
});

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

// 예약 상태 업데이트 함수
function updateReservationStatus() {
    const seatQuery = `
        UPDATE seat_reservations
        SET status = '예약가능'
        WHERE end_time <= NOW();
    `;

    const roomQuery = `
        UPDATE room_reservations
        SET status = '예약가능'
        WHERE end_time <= NOW();
    `;

    return new Promise((resolve, reject) => {
        // 좌석 예약 업데이트
        db.query(seatQuery, (err, seatResult) => {
            if (err) {
                console.error('좌석 예약 상태 업데이트 오류:', err);
                reject(err);
                return;
            }

            // 회의실 예약 업데이트
            db.query(roomQuery, (err, roomResult) => {
                if (err) {
                    console.error('호실 예약 상태 업데이트 오류:', err);
                    reject(err);
                    return;
                }

                console.log(
                    `좌석 예약 상태 ${seatResult.affectedRows}개, 호실 예약 상태 ${roomResult.affectedRows}개가 업데이트됨`
                );
                resolve({
                    seatRows: seatResult.affectedRows,
                    roomRows: roomResult.affectedRows
                });
            });
        });
    });
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
    // 공간 예약 관련 초기화 (space_reservation.html)
    const buildingSelect = document.getElementById('building');
    const floorSelect = document.getElementById('floor');
    const roomSelect = document.getElementById('room');
    if (buildingSelect) {
        buildingSelect.value = buildingId;
        // change 이벤트만 발생시키고, API 호출은 updateFloors에서 한 번만 하도록 함
        buildingSelect.dispatchEvent(new Event('change'));
    }
    // 알림 표시
    alert(`${buildingName}이(가) 선택되었습니다.`);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function () {
    try {
        const reservationList = document.getElementById('reservationList');
        const sejongMap = document.getElementById('sejong-map');
        const buildingSelect = document.getElementById('building');
        const floorSelect = document.getElementById('floor');
        const roomSelect = document.getElementById('room');

        if (reservationList) {
            await loadReservations();
        }

        if (sejongMap) {
            await switchCampus('sejong');
        }

        if (buildingSelect) {
            await loadBuildings();
            buildingSelect.addEventListener('change', async function () {
                console.log('건물 선택 변경됨:', this.value);
                await updateFloors();
                const firstFloor = document.getElementById('floor').value;
                if (firstFloor) {
                    console.log('첫 번째 층 선택:', firstFloor);
                    await updateRooms();
                }
            });
        }

        if (floorSelect) {
            const pageType = document.querySelector('.space-reservation') ? 'space-reservation' : 'seat-reservation';
        
            if (pageType === 'space-reservation') {
                // 호실 예약에서 층 선택 시 updateRooms 실행
                floorSelect.addEventListener('change', updateRooms);
            } else if (pageType === 'seat-reservation') {
                // 좌석 예약에서 층 선택 시 updateRoomForSeats 실행
                floorSelect.addEventListener('change', updateRoomForSeats);
        
                // 호실 선택 시 updateSeats 실행 (호실을 선택할 때만 좌석을 업데이트)
                if (roomSelect) {
                    roomSelect.addEventListener('change', updateSeats);
                }
            }
        }
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
    }
});
