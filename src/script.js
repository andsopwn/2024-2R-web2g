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

function reserveSpace() {
    const building = document.getElementById('building').value;
    const floor = document.getElementById('floor').value;
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (building && floor && room && date && startTime && endTime) {
        alert(`${building} ${room}호 공간이 ${date} ${startTime}부터 ${endTime}까지 예약되었습니다.`);
        location.href = 'my_reservations.html';
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
    } else {
        alert("모든 항목을 선택하고 좌석을 선택해주세요.");
    }
}
