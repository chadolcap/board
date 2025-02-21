/** @format */

// Firebase SDK 타입 임포트
import {initializeApp} from 'firebase/app';
import {getFirestore, collection, addDoc, getDocs, updateDoc, arrayUnion, doc, deleteDoc, DocumentData, QuerySnapshot, DocumentReference} from 'firebase/firestore';

// Firebase 설정 객체 타입 정의
interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId: string;
}

// 질문 인터페이스 정의
interface Question {
	id: string;
	text: string;
	answers?: string[];
}

// Firebase 설정 객체
const firebaseConfig: FirebaseConfig = {
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
const questionForm = document.getElementById('questionForm') as HTMLFormElement;
const questionInput = document.getElementById('questionInput') as HTMLInputElement;
const questionList = document.getElementById('questionList') as HTMLDivElement;

// 질문 제출 이벤트 리스너
questionForm.addEventListener('submit', async function (event: Event) {
	event.preventDefault(); // 기본 제출 동작 방지
	const questionText: string = questionInput.value; // 입력된 질문 텍스트
	await addQuestion(questionText); // 질문 추가 함수 호출
	questionInput.value = ''; // 입력 필드 초기화
});

// 질문 추가 함수
async function addQuestion(text: string): Promise<void> {
	const questionRef = await addDoc(collection(db, 'questions'), {
		text: text,
		answers: []
	}); // Firestore에 질문 추가

	// 질문을 추가한 후, 질문을 표시합니다.
	displayQuestion({id: questionRef.id, text: text}); // 질문 표시
}

// 질문 표시 함수
function displayQuestion({id, text, answers = []}: Question): void {
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
	const deleteButton = questionDiv.querySelector('.delete-button') as HTMLButtonElement;
	deleteButton.addEventListener('click', async () => {
		await deleteQuestion(id);
	});

	// 답변 폼 이벤트 리스너
	const answerForm = questionDiv.querySelector('.answerForm') as HTMLFormElement;
	answerForm.addEventListener('submit', async function (event: Event) {
		event.preventDefault();
		const answerInput = event.target as HTMLFormElement;
		const input = answerInput.querySelector('input') as HTMLInputElement;
		const answerText: string = input.value;
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
async function addAnswer(questionId: string, text: string): Promise<void> {
	const questionRef = doc(db, 'questions', questionId);
	await updateDoc(questionRef, {
		answers: arrayUnion(text) // Firestore에 답변 추가
	});

	displayAnswer(questionId, text); // 답변 표시
}

// 답변 표시 함수
function displayAnswer(questionId: string, text: string): void {
	console.log('답변 표시 시도:', {questionId, text});
	console.log('현재 질문 목록:', questionList.children);

	if (!questionList) {
		console.error('질문 목록을 찾을 수 없습니다.');
		return;
	}

	const questions = Array.from(questionList.children);
	console.log(
		'질문 배열:',
		questions.map(q => (q as HTMLElement).dataset.id)
	);

	const questionDiv = questions.find(div => {
		console.log('비교:', (div as HTMLElement).dataset.id, questionId);
		return (div as HTMLElement).dataset.id === questionId;
	}) as HTMLElement | undefined;

	if (questionDiv) {
		const answersDiv = questionDiv.querySelector('.answers') as HTMLDivElement;
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
			const retryQuestionDiv = Array.from(questionList.children).find(div => (div as HTMLElement).dataset.id === questionId) as HTMLElement | undefined;

			if (retryQuestionDiv) {
				const answersDiv = retryQuestionDiv.querySelector('.answers') as HTMLDivElement;
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
async function deleteQuestion(questionId: string): Promise<void> {
	const questionRef = doc(db, 'questions', questionId);
	await deleteDoc(questionRef); // Firestore에서 질문 삭제

	const questionDiv = Array.from(questionList.children).find(div => (div as HTMLElement).dataset.id === questionId) as HTMLElement | undefined;

	if (questionDiv) {
		questionList.removeChild(questionDiv); // DOM에서 질문 삭제
	}
}

// Firestore에서 질문 불러오기
async function loadQuestions(): Promise<void> {
	const snapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, 'questions'));
	snapshot.forEach(doc => {
		const data = doc.data();
		displayQuestion({
			id: doc.id,
			text: data.text,
			answers: data.answers || []
		});
	});
}

// 페이지 로드 시 질문 불러오기
loadQuestions();
