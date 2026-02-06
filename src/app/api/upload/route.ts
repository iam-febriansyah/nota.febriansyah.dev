import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const extension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${extension}`;
    
    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    const publicUrl = `/uploads/receipts/${fileName}`;

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      url: publicUrl 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'Upload failed', error: (error as Error).message },
      { status: 500 }
    );
  }
}
