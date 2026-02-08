import { NextRequest, NextResponse } from 'next/server';
import { createTopupApprovalMessage } from '@/lib/feishu';
import { sendFeishuWebhookMessage } from '@/lib/feishu-api';
import { FEISHU_CONFIG } from '@/lib/feishu';

export async function GET(request: NextRequest) {
  const diagnosticInfo = {
    webhookUrl: FEISHU_CONFIG.webhookUrl,
    webhookUrlConfigured: !!FEISHU_CONFIG.webhookUrl,
    appId: FEISHU_CONFIG.appId,
    appSecretConfigured: !!FEISHU_CONFIG.appSecret,
    appUrl: FEISHU_CONFIG.appUrl,
  };

  return NextResponse.json({
    success: true,
    diagnostic: diagnosticInfo,
  });
}

export async function POST(request: NextRequest) {
  try {
    // 创建测试消息
    const testMessage = createTopupApprovalMessage({
      requestId: 999,
      email: 'test@example.com',
      tierName: '经济包',
      credits: 50,
      price: '20',
      createdAt: new Date(),
    });

    console.log('发送测试飞书消息:', JSON.stringify(testMessage, null, 2));

    // 发送消息
    const result = await sendFeishuWebhookMessage(testMessage);

    return NextResponse.json({
      success: result,
      message: result ? '测试消息发送成功' : '测试消息发送失败',
      messageContent: testMessage,
    });
  } catch (error: any) {
    console.error('测试飞书消息失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
