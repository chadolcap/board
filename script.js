/** @format */

// Firebase SDK를 동적으로 추가
function loadFirebaseSDK() {
	const scripts = ['https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js'];

	return Promise.all(
		scripts.map(url => {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = url;
				script.async = true;
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		})
	);
}

// Firebase SDK 로드 후 초기화
async function initializeFirebase() {
	await loadFirebaseSDK();

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
	firebase.initializeApp(firebaseConfig);
	return firebase.firestore();
}

// 전역 변수로 db 선언
let db;

// DOM 요소 선택
const questionForm = document.getElementById('questionForm');
const questionInput = document.getElementById('questionInput');
const questionList = document.getElementById('questionList');

// Firebase 초기화 및 앱 시작
async function startApp() {
	try {
		db = await initializeFirebase();
		await loadQuestions();
	} catch (error) {
		console.error('Firebase 초기화 중 오류 발생:', error);
	}
}

// 질문 제출 이벤트 리스너
questionForm.addEventListener('submit', async function (event) {
	event.preventDefault(); // 기본 제출 동작 방지
	const questionText = questionInput.value; // 입력된 질문 텍스트
	await addQuestion(questionText); // 질문 추가 함수 호출
	questionInput.value = ''; // 입력 필드 초기화
});

// 질문 추가 함수
async function addQuestion(text) {
	const questionRef = await db.collection('questions').add({
		text: text,
		answers: []
	});

	displayQuestion({id: questionRef.id, text: text});
}

// 질문 표시 함수
function displayQuestion({id, text, answers = []}) {
	console.log('질문 표시:', {id, text, answers}); // 디버깅 로그 추가

	const questionDiv = document.createElement('div');
	questionDiv.classList.add('question');
	questionDiv.dataset.id = id;

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

	// 삭제 버튼 이벤트 리스너
	const deleteButton = questionDiv.querySelector('.delete-button');
	deleteButton.addEventListener('click', async () => {
		await deleteQuestion(id);
	});

	// 답변 폼 이벤트 리스너
	const answerForm = questionDiv.querySelector('.answerForm');
	answerForm.addEventListener('submit', async function (event) {
		event.preventDefault();
		const answerInput = event.target;
		const input = answerInput.querySelector('input');
		const answerText = input.value;
		await addAnswer(id, answerText);
		input.value = '';
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
	const questionRef = db.collection('questions').doc(questionId);
	await questionRef.update({
		answers: firebase.firestore.FieldValue.arrayUnion(text)
	});

	displayAnswer(questionId, text);
}

// 답변 표시 함수
function displayAnswer(questionId, text) {
	console.log('답변 표시 시도:', {questionId, text});
	console.log('현재 질문 목록:', questionList.children);

	if (!questionList) {
		console.error('질문 목록을 찾을 수 없습니다.');
		return;
	}

	const questions = Array.from(questionList.children);
	console.log(
		'질문 배열:',
		questions.map(q => q.dataset.id)
	);

	const questionDiv = questions.find(div => div.dataset.id === questionId);

	if (questionDiv) {
		const answersDiv = questionDiv.querySelector('.answers');
		if (!answersDiv) {
			console.error('답변 영역을 찾을 수 없습니다.');
			return;
		}

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
			const retryQuestionDiv = Array.from(questionList.children).find(div => div.dataset.id === questionId);

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
	await db.collection('questions').doc(questionId).delete();

	const questionDiv = Array.from(questionList.children).find(div => div.dataset.id === questionId);
	if (questionDiv) {
		questionList.removeChild(questionDiv);
	}
}

// Firestore에서 질문 불러오기
async function loadQuestions() {
	const snapshot = await db.collection('questions').get();
	snapshot.forEach(doc => {
		const data = doc.data();
		displayQuestion({
			id: doc.id,
			text: data.text,
			answers: data.answers || []
		});
	});
}

// 페이지 로드 시 앱 시작
startApp();
