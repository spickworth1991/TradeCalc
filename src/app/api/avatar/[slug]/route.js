import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { slug } = await params;
  const filePath = path.join(process.cwd(), 'public', 'avatars', `${slug}.webp`);
  const defaultPath = path.join(process.cwd(), 'public', 'avatars', 'default.webp');

  try {
    const file = fs.readFileSync(fs.existsSync(filePath) ? filePath : defaultPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    return new NextResponse('Image not found', { status: 404 });
  }
}
