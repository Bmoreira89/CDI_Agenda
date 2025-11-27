import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { filename, contentBase64 } = await req.json()
    if (!filename || !contentBase64) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const buffer = Buffer.from(contentBase64, 'base64')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeName = Date.now() + '-' + filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fullPath = path.join(uploadsDir, safeName)
    await fs.writeFile(fullPath, buffer)
    return NextResponse.json({ url: `/uploads/${safeName}` })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}