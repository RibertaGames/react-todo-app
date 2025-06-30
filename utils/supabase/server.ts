// utils/supabase/server.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
  // cookies を渡すと、exchangeCodeForSession がレスポンスに Cookie を自動セット
  return createRouteHandlerClient({ cookies })
}
