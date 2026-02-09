import { NextRequest, NextResponse } from 'next/server';
import { S3Storage, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 });
    }

    // 转换 File 为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 初始化对象存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL || 'https://integration.coze.cn/coze-coding-s3proxy/v1',
      accessKey: process.env.COZE_BUCKET_ACCESS_KEY || '',
      secretKey: process.env.COZE_BUCKET_SECRET_KEY || '',
      bucketName: process.env.COZE_BUCKET_NAME || 'bucket_1770551849947',
      region: 'cn-beijing',
    });

    // 上传文件
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: file.name,
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return NextResponse.json({ fileKey });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '文件上传失败' },
      { status: 500 }
    );
  }
}
