import { NextResponse } from 'next/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request) {
  try {
    const { reportData, activeTab, selectedWeek } = await request.json();

    const fmt = (items) =>
      items?.length
        ? items.map((i, idx) => `  ${idx + 1}. [${i.status}] ${i.text}`).join('\n')
        : '  (없음)';

    const prompt = `당신은 기업 업무보고 품질을 검수하는 전문가입니다.
아래는 미래인재실 "${activeTab}" 파트의 ${selectedWeek} 주간업무 보고입니다.

[전주 실적]
${fmt(reportData.prev_work)}

[금주 진행 사항]
${fmt(reportData.curr_work)}

[차주 예정 업무]
${fmt(reportData.next_work)}

다음 두 가지 기준으로 각 항목을 분석하세요:

① 트래킹 누락: 전주-금주-차주 업무가 논리적으로 연결되지 않는 경우
   - 전주에 진행중이었던 업무가 금주에 언급되지 않거나 완료 여부 불명확
   - 금주 신규 업무인데 차주 후속 계획이 없는 경우

② 구체성 부족: 수치, 건수, 날짜, 목표값 등 구체적 결과물이 없는 문장
   - "검토", "진행", "준비" 등 모호한 동사만 있고 정량적 지표가 없는 경우

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON만):
{
  "prev_work": [{"index": 0, "flags": [], "comment": ""}],
  "curr_work": [{"index": 0, "flags": [], "comment": ""}],
  "next_work": [{"index": 0, "flags": [], "comment": ""}],
  "summary": "전체 보고서 품질 총평 2~3문장"
}

규칙:
- flags: "트래킹 누락" 또는 "구체성 부족" 중 해당하는 것만, 없으면 []
- comment: flags가 있을 때만 한 문장 설명, 없으면 ""
- 모든 항목 index 순서대로 빠짐없이 포함, 항목 없는 섹션은 []`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: `API 오류 (${res.status}): ${responseText}` }, { status: 500 });
    }

    const data = JSON.parse(responseText);
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);

  } catch (e) {
    return NextResponse.json({ error: '서버 오류: ' + e.message }, { status: 500 });
  }
}
