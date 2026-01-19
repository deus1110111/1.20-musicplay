# Google Sheets 연동 설정 가이드

이 가이드를 따라 설문 응답을 Google Sheets로 수집할 수 있습니다.

## 1단계: Google Sheets 생성

1. [Google Sheets](https://sheets.google.com)로 이동 **(deus1110111@gmail.com 계정 사용)**
2. 새 스프레드시트 만들기
3. 첫 번째 행에 다음 헤더 입력:

| 타임스탬프 | 학년 | 반 | 번호 | 이름 | Q1 | Q1_이유 | Q2 | Q3 | Q4_악기 | Q4_상세 | Q5_장르 | Q5_이유 | Q6_제목 | Q6_이유 | Q7_제목 | Q7_이유 | Q8 | Q9 | Q10 |

## 2단계: Apps Script 설정

1. 스프레드시트에서 **확장 프로그램 > Apps Script** 클릭
2. 기존 코드를 모두 삭제하고 아래 코드 붙여넣기:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.timestamp,
    data.grade,
    data.class,
    data.number,
    data.name,
    data.q1,
    data.q1_reason,
    data.q2,
    data.q3,
    data.q4_inst,
    data.q4_detail,
    data.q5_genre,
    data.q5_reason,
    data.q6_title,
    data.q6_reason,
    data.q7_title,
    data.q7_reason,
    data.q8,
    data.q9,
    data.q10
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. 프로젝트 이름 지정 (예: "음악 설문 수집")
4. 💾 저장 버튼 클릭

## 3단계: 웹 앱으로 배포

1. **배포 > 새 배포** 클릭
2. **유형 선택** 옆 ⚙️ 아이콘 클릭 → **웹 앱** 선택
3. 설정:
   - **설명**: 음악 설문 수집
   - **다음 사용자로 실행**: 나
   - **액세스 권한이 있는 사용자**: **모든 사용자**
4. **배포** 클릭
5. **웹 앱 URL** 복사 (https://script.google.com/... 형식)

## 4단계: 웹사이트에 URL 적용

1. `script.js` 파일 열기
2. 다음 줄 찾기:
```javascript
const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```
3. 복사한 URL로 교체:
```javascript
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```
4. 저장

## 완료! ✅

이제 학생들이 설문을 제출하면 자동으로 Google Sheets에 저장됩니다.

## 참고사항

- Apps Script 코드를 수정하면 **새 버전으로 다시 배포**해야 합니다
- 많은 학생이 동시 제출해도 안전하게 저장됩니다
- 스프레드시트에서 실시간으로 응답 확인 가능합니다
