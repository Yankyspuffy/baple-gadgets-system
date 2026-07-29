import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { passphrase } = await request.json()
    const correctPassphrase = process.env.ADMIN_PASSPHRASE

    if (!correctPassphrase) {
      console.error("ADMIN_PASSPHRASE environment variable is not set.")
      return NextResponse.json({ error: 'Auth not configured on server' }, { status: 500 })
    }

    if (passphrase === correctPassphrase) {
      cookies().set('admin_auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
