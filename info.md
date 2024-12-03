### 테이블명
webp;

## 1. 세팅
``` sql
CREATE DATABASE webp;
USE webp;
```

## 2. 테이블 생성
``` sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(10) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 건물 테이블
CREATE TABLE buildings (
    building_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,  -- 건물 이름 중복 불가
    basement_floors INT DEFAULT 0,
    ground_floors INT NOT NULL
);
-- 건물 임시데이터
INSERT INTO buildings (name, basement_floors, ground_floors) VALUES
    ('농심국제관', 1, 5),
    ('문화스포츠관', 1, 4),
    ('학생회관', 1, 4),
    ('과학기술1관', 1, 4),
    ('과학기술2관', 1, 4),
    ('공공정책관', 1, 5),
    ('석원경상관', 1, 5),
    ('학술정보원', 2, 4),
    ('ICT가속기관', 2, 4),    
    ('산학협력관', 1, 3);
    
-- 호실 테이블
CREATE TABLE rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    building_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT,
    room_type VARCHAR(50) NOT NULL,        -- 'lecture', 'seminar', 'lab' 등
    FOREIGN KEY (building_id) REFERENCES buildings(building_id),
    UNIQUE KEY (building_id, room_number)
);

-- 좌석 정보 테이블 수정
CREATE TABLE seats (
    seat_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    row_num INT NOT NULL,  -- 행 번호 (1=A, 2=B, ...)
    col_num INT NOT NULL,  -- 열 번호 (1,2,3,...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    UNIQUE KEY unique_seat_position (room_id, row_num, col_num)  -- 같은 방에서 같은 위치의 좌석 중복 방지
);

-- 호실 예약 테이블 (행사 주최자용)
CREATE TABLE room_reservations (
    reservation_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    host_id VARCHAR(10) NOT NULL,  -- student_id를 저장
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
	status ENUM('예약가능', '점검중', '예약불가') DEFAULT '예약불가',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (host_id) REFERENCES users(student_id)
);
-- 좌석 예약 테이블
CREATE TABLE seat_reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    seat_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL,  
    room_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
	status ENUM('예약가능', '점검중', '예약불가') DEFAULT '예약불가',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (student_id) REFERENCES users(student_id)
);
```

## 3. MySQL 사용자 인증 방식 변경
### 1. MySQL 접속
``` bash
mysql -u root -p
```

### 2. 인증 방식 변경
``` sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tkdlqj1!';
```

### 3. 변경사항 저장
``` sql
FLUSH PRIVILEGES;
```

