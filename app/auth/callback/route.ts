import { NextRequest } from 'next/server'
import { handleAuthCallback } from '../confirm/route'

export async function GET(request: NextRequest) {
  return handleAuthCallback(request)
}
