# 미래인재실 주간업무 보고 대시보드

> **MIRAI Dashboard** — Supabase 연동 주간업무 보고 시스템

---

## 📦 Vercel 배포 방법 (5분 완성)

### 방법 1: GitHub → Vercel (권장)

1. **GitHub 레포 생성** 후 이 프로젝트 폴더 전체를 push
   ```bash
   git init
   git add .
   git commit -m "init: mirai dashboard"
   git remote add origin https://github.com/YOUR_ID/mirai-dashboard.git
   git push -u origin main
   ```

2. **[vercel.com](https://vercel.com)** 접속 → `Add New Project`
3. GitHub 레포 선택 → **Deploy** 클릭 (설정 그대로 유지)
4. 30초 후 배포 완료 🎉

### 방법 2: Vercel CLI

```bash
npm i -g vercel
cd mirai-dashboard
vercel --prod
```

---

## 🗄️ Supabase 테이블 설정

Supabase 대시보드 → SQL Editor에서 실행:

```sql
create table weekly_reports (
  id          bigint generated always as identity primary key,
  week_id     text   not null,
  part_name   text   not null,
  prev_work   jsonb  default '[]',
  curr_work   jsonb  default '[]',
  next_work   jsonb  default '[]',
  ax_case     text   default '',
  notices     text   default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(week_id, part_name)
);

-- RLS (Row Level Security) - 필요시 설정
alter table weekly_reports enable row level security;
create policy "Allow all" on weekly_reports for all using (true);
```

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| **인라인 편집** | 항목 더블클릭으로 즉시 수정 |
| **상태 관리** | 완료 / 진행중 / 예정 / 지연 드롭다운 |
| **항목 삭제** | 호버 시 휴지통 아이콘 클릭 |
| **자동 이관** | 금주→전주 one-click 이관 |
| **키보드 저장** | ⌘S / Ctrl+S |
| **진행률 바** | 완료 항목 기준 자동 계산 |
| **네트워크 감지** | 온/오프라인 상태 표시 |
| **Supabase 실시간 동기화** | upsert 기반 안전 저장 |

---

## 🛠️ 로컬 개발

```bash
npm install
npm run dev
# → http://localhost:3000
```
