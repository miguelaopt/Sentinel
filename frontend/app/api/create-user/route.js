import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Apenas admins deviam poder fazer isto, mas simplificamos para o teste
  const body = await request.json();
  const { email, password, fullName, role } = body;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Chave Secreta
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Atualizar Role
  await supabaseAdmin
    .from('profiles')
    .update({ role: role })
    .eq('id', data.user.id);

  return NextResponse.json({ message: 'User created', user: data.user });
}