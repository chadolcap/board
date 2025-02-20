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
	console.log('질문 표시:', {id, text, answers}); // 디버깅 로그 추가

	const questionDiv = document.createElement('div');
	questionDiv.classList.add('question');
	questionDiv.dataset.id = id; // ID 설정 확인

	// 질문 구조 생성
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
    `;

	// 이벤트 리스너 설정
	questionDiv.querySelector('.delete-button').addEventListener('click', async function () {
		await deleteQuestion(id);
	});

	questionDiv.querySelector('.answerForm').addEventListener('submit', async function (event) {
		event.preventDefault();
		const answerInput = event.target.querySelector('input');
		const answerText = answerInput.value;
		await addAnswer(id, answerText);
		answerInput.value = '';
	});

	// 질문을 목록에 추가
	questionList.appendChild(questionDiv);
	console.log('질문이 DOM에 추가됨:', questionDiv);

	// 기존 답변들을 표시
	if (answers && answers.length > 0) {
		console.log('기존 답변 표시 시작:', answers);
		answers.forEach(answer => {
			displayAnswer(id, answer);
		});
	}
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
	// 디버깅을 위한 로그 추가
	console.log('답변 표시 시도:', {questionId, text});
	console.log('현재 질문 목록:', questionList.children);

	// 질문 찾기 전에 questionList가 존재하는지 확인
	if (!questionList) {
		console.error('질문 목록을 찾을 수 없습니다.');
		return;
	}

	// 모든 질문 요소를 배열로 변환하고 해당 ID를 가진 질문 찾기
	const questions = Array.from(questionList.children);
	console.log(
		'질문 배열:',
		questions.map(q => q.dataset.id)
	);

	const questionDiv = questions.find(div => {
		console.log('비교:', div.dataset.id, questionId);
		return div.dataset.id === questionId;
	});

	if (questionDiv) {
		// 답변을 표시할 영역 찾기
		const answersDiv = questionDiv.querySelector('.answers');
		if (!answersDiv) {
			console.error('답변 영역을 찾을 수 없습니다.');
			return;
		}

		// 새 답변 요소 생성 및 추가
		try {
			const answerDiv = document.createElement('div');
			answerDiv.classList.add('answer');
			answerDiv.textContent = text;
			answersDiv.appendChild(answerDiv);
			console.log('답변이 성공적으로 추가되었습니다.');
		} catch (error) {
			console.error('답변 추가 중 오류 발생:', error);
		}
	} else {
		console.error('해당 ID의 질문을 찾을 수 없습니다:', questionId);
		// 질문이 아직 로드되지 않았을 수 있으므로, 잠시 후 다시 시도
		setTimeout(() => {
			const retryQuestionDiv = [...questionList.children].find(div => div.dataset.id === questionId);
			if (retryQuestionDiv) {
				const answersDiv = retryQuestionDiv.querySelector('.answers');
				const answerDiv = document.createElement('div');
				answerDiv.classList.add('answer');
				answerDiv.textContent = text;
				answersDiv.appendChild(answerDiv);
				console.log('재시도 후 답변이 추가되었습니다.');
			}
		}, 100);
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
