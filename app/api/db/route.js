import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tdqvoyhdeseuncqtytpv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXZveWhkZXNldW5jcXR5dHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDc0NjIsImV4cCI6MjA5NDkyMzQ2Mn0.4zNhLMDMUQaOh4k8soWDD9zTF2BmGvoG5ftae86sB9o";

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    const supabase = getSupabase();

    if (action === 'load') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*')
        .eq('week_id', payload.week_id).eq('part_name', payload.part_name)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'load_prev') {
      const { data, error } = await supabase
        .from('weekly_reports').select('curr_work')
        .eq('week_id', payload.week_id).eq('part_name', payload.part_name)
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'load_all') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*').eq('week_id', payload.week_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'load_weeks') {
      const { data, error } = await supabase
        .from('weekly_reports').select('week_id');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'search') {
      const { data, error } = await supabase
        .from('weekly_reports').select('*').in('week_id', payload.week_ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    if (action === 'save') {
      const { week_id, part_name, prev_work, curr_work, next_work, ax_case, notices } = payload;

      // 기존 row 확인 후 update 또는 insert
      const { data: existing } = await supabase
        .from('weekly_reports').select('id')
        .eq('week_id', week_id).eq('part_name', part_name)
        .maybeSingle();

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
