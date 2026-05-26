import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tdqvoyhdeseuncqtytpv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXZveWhkZXNldW5jcXR5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDc0NjIsImV4cCI6MjA5NDkyMzQ2Mn0.4zNhLMDMUQaOh4k8soWDD9zTF2BmGvoG5ftae86sB9o";

function sb() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    const supabase = sb();

    if (action === 'load') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*')
        .eq('week_id', payload.week_id).eq('part_name', payload.part_name)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // 전주 curr_work 조회 (이관용)
    if (action === 'load_prev') {
      const { data, error } = await supabase
        .from('weekly_reports').select('curr_work')
        .eq('week_id', payload.week_id).eq('part_name', payload.part_name)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // 특정 주차 전체 파트 (분석/현황판)
    if (action === 'load_all') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*').eq('week_id', payload.week_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // 주차 목록
    if (action === 'load_weeks') {
      const { data, error } = await supabase
        .from('weekly_reports').select('week_id');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // ★ 전체 업무 보기 — 모든 주차·파트 데이터 조회
    if (action === 'load_global') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*').order('week_id', { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // 기간 검색
    if (action === 'search') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*').in('week_id', payload.week_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    // ★ 저장 — upsert 방식으로 단순화
    if (action === 'save') {
      const { week_id, part_name, prev_work, curr_work, next_work, ax_case, notices } = payload;

      const { data: existing } = await supabase
        .from('weekly_reports').select('id')
        .eq('week_id', week_id).eq('part_name', part_name).maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('weekly_reports')
          .update({ prev_work, curr_work, next_work, ax_case, notices })
          .eq('week_id', week_id).eq('part_name', part_name));
      } else {
        ({ error } = await supabase
          .from('weekly_reports')
          .insert({ week_id, part_name, prev_work, curr_work, next_work, ax_case, notices }));
      }

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
