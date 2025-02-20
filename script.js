/** @format */

// Firebase SDK 추가
import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {getFirestore, collection, addDoc, getDocs, updateDoc, arrayUnion, doc, deleteDoc} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase 설정 객체
const firebaseConfig = {
	apiKey: 'AIzaSyAx-fA2fUlm06zyS3yMgl89_rAm7tssvUs',
	authDomain: 'qna-board-d3c80.firebaseapp.com',
	projectId: 'qna-board-d3c80',
	storageBucket: 'qna-board-d3c80.firebasestorage.app',
	messagingSenderId: '76118308944',
	appId: '1:76118308944:web:8652f66fae8e3b77407955',
	measurementId: 'G-70Z3P2YP8Y'
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 요소 선택
const questionForm = document.getElementById('questionForm');
const questionInput = document.getElementById('questionInput');
const questionList = document.getElementById('questionList');

// 질문 제출 이벤트 리스너
questionForm.addEventListener('submit', async function (event) {
	event.preventDefault(); // 기본 제출 동작 방지
	const questionText = questionInput.value; // 입력된 질문 텍스트
	await addQuestion(questionText); // 질문 추가 함수 호출
	questionInput.value = ''; // 입력 필드 초기화
});

// 질문 추가 함수
async function addQuestion(text) {
	const questionRef = await addDoc(collection(db, 'questions'), {
		text: text,
		answers: []
	}); // Firestore에 질문 추가

	// 질문을 추가한 후, 질문을 표시합니다.
	displayQuestion({id: questionRef.id, text: text}); // 질문 표시
}

// 질문 표시 함수
function displayQuestion({id, text, answers = []}) {
	const questionDiv = document.createElement('div'); // 질문 div 생성
	questionDiv.classList.add('question'); // 클래스 추가
	questionDiv.dataset.id = id; // 질문 ID를 data-id 속성에 저장
	questionDiv.innerHTML = `
        <p>${text}</p>
        <div class="question-controls">
            <button class="delete-button">삭제</button>
            <form class="answerForm">
                <input type="text" placeholder="답변을 입력하세요" required>
                <button type="submit">답변하기</button>
            </form>
        </div>
        <div class="answers"></div>
    `; // 질문 내용 및 답변 폼 추가

	// 삭제 버튼 이벤트 리스너
	questionDiv.querySelector('.delete-button').addEventListener('click', async function () {
		await deleteQuestion(id); // 질문 삭제 함수 호출
	});

	// 답변 제출 이벤트 리스너
	questionDiv.querySelector('.answerForm').addEventListener('submit', async function (event) {
		event.preventDefault(); // 기본 제출 동작 방지
		const answerInput = event.target.querySelector('input'); // 답변 입력 필드
		const answerText = answerInput.value; // 입력된 답변 텍스트
		await addAnswer(id, answerText); // 답변 추가 함수 호출
		answerInput.value = ''; // 입력 필드 초기화
	});

	// 기존 답변 표시
	answers.forEach(answer => {
		displayAnswer(id, answer); // 기존 답변 표시
	});

	questionList.appendChild(questionDiv); // 질문 리스트에 질문 추가
}

// 답변 추가 함수
async function addAnswer(questionId, text) {
	const questionRef = doc(db, 'questions', questionId);
	await updateDoc(questionRef, {
		answers: arrayUnion(text) // Firestore에 답변 추가
	});

	displayAnswer(questionId, text); // 답변 표시
}

// 답변 표시 함수
function displayAnswer(questionId, text) {
	console.log('displayAnswer > > ', questionId, text);
	const questionDiv = [...questionList.children].find(div => div.dataset.id === questionId); // data-id로 질문 찾기
	console.log('displayAnswer > > ', questionDiv);
	if (questionDiv) {
		const answersDiv = questionDiv.querySelector('.answers'); // 답변 리스트 선택
		const answerDiv = document.createElement('div'); // 답변 div 생성
		answerDiv.classList.add('answer'); // 클래스 추가
		answerDiv.textContent = text; // 답변 텍스트 추가
		answersDiv.appendChild(answerDiv); // 답변 리스트에 답변 추가
	} else {
		console.error('해당 ID의 질문을 찾을 수 없습니다:', questionId);
	}
}

// 질문 삭제 함수
async function deleteQuestion(questionId) {
	const questionRef = doc(db, 'questions', questionId);
	await deleteDoc(questionRef); // Firestore에서 질문 삭제
	const questionDiv = [...questionList.children].find(div => div.dataset.id === questionId);
	if (questionDiv) {
		questionList.removeChild(questionDiv); // DOM에서 질문 삭제
	}
}

// Firestore에서 질문 불러오기
async function loadQuestions() {
	const snapshot = await getDocs(collection(db, 'questions'));
	snapshot.forEach(doc => {
		displayQuestion({id: doc.id, text: doc.data().text, answers: doc.data().answers || []});
	});
}

// 페이지 로드 시 질문 불러오기
loadQuestions();
