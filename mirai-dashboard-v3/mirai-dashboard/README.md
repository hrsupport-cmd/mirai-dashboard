# 미래인재실 주간업무 보고 대시보드

## Vercel 배포 (5분)

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_ID/mirai-dashboard.git
git push -u origin main
```
→ vercel.com → Import → Deploy

**⚠️ 중요: Vercel 환경변수 설정 필수**
Settings → Environment Variables에 추가:
```
ANTHROPIC_API_KEY = sk-ant-xxxxxxxx
```

## Supabase 테이블

```sql
create table weekly_reports (
  id         bigint generated always as identity primary key,
  week_id    text not null,
  part_name  text not null,
  prev_work  jsonb default '[]',
  curr_work  jsonb default '[]',
  next_work  jsonb default '[]',
  ax_case    text default '',
  notices    text default '',
  created_at timestamptz default now(),
  unique(week_id, part_name)
);
alter table weekly_reports enable row level security;
create policy "Allow all" on weekly_reports for all using (true);
```

## 로컬 개발

```bash
cp .env.example .env.local
# ANTHROPIC_API_KEY 입력
npm install && npm run dev
```

## 기능

| 기능 | 설명 |
|------|------|
| **주차 자동 생성** | 날짜 선택 → `YYYY-MM-WN` 자동 계산 |
| **전주 자동 이관** | 새 주차 선택 시 전주 금주 내용 → 전주 실적 자동 로드 |
| **기간별 검색** | 시작~종료일 입력 → 해당 주차 전체 업무 일괄 조회 |
| **AI 분석** | Claude가 트래킹 누락 / 구체성 부족 자동 탐지 |
| **현황판** | 칸반 보드로 상태별 전체 업무 한눈에 보기 |
| **인라인 편집** | 더블클릭 → 즉시 수정, 상태 드롭다운 변경 |
| **⌘S 저장** | 키보드 단축키 |
