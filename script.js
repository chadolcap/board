/** @format */

// 질문 게시판 기능 구현

// DOM 요소 선택
const questionForm = document.getElementById('questionForm');
const questionInput = document.getElementById('questionInput');
const questionList = document.getElementById('questionList');

// 질문 제출 이벤트 리스너
questionForm.addEventListener('submit', function (event) {
	event.preventDefault(); // 기본 제출 동작 방지
	const questionText = questionInput.value; // 입력된 질문 텍스트
	addQuestion(questionText); // 질문 추가 함수 호출
	questionInput.value = ''; // 입력 필드 초기화
});

// 질문 추가 함수
function addQuestion(text) {
	const questionDiv = document.createElement('div'); // 질문 div 생성
	questionDiv.classList.add('question'); // 클래스 추가
	questionDiv.innerHTML = `
        <p>${text}</p>
        <form class="answerForm">
            <input type="text" placeholder="답변을 입력하세요" required>
            <button type="submit">답변하기</button>
        </form>
        <div class="answers"></div>
    `; // 질문 내용 및 답변 폼 추가

	// 답변 제출 이벤트 리스너
	questionDiv.querySelector('.answerForm').addEventListener('submit', function (event) {
		event.preventDefault(); // 기본 제출 동작 방지
		const answerInput = event.target.querySelector('input'); // 답변 입력 필드
		const answerText = answerInput.value; // 입력된 답변 텍스트
		addAnswer(questionDiv.querySelector('.answers'), answerText); // 답변 추가 함수 호출
		answerInput.value = ''; // 입력 필드 초기화
	});

	questionList.appendChild(questionDiv); // 질문 리스트에 질문 추가
}

// 답변 추가 함수
function addAnswer(answersDiv, text) {
	const answerDiv = document.createElement('div'); // 답변 div 생성
	answerDiv.classList.add('answer'); // 클래스 추가
	answerDiv.textContent = text; // 답변 텍스트 추가
	answersDiv.appendChild(answerDiv); // 답변 리스트에 답변 추가
}
