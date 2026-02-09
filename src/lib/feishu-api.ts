import { FEISHU_CONFIG } from './feishu';

// 获取飞书应用访问令牌
export async function getFeishuAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${FEISHU_CONFIG.apiBaseUrl}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.appId,
        app_secret: FEISHU_CONFIG.appSecret,
      }),
    });

    const data = await response.json();

    if (data.code !== 0) {
      console.error('获取飞书访问令牌失败:', data);
      return null;
    }

    return data.tenant_access_token;
  } catch (error) {
    console.error('获取飞书访问令牌出错:', error);
    return null;
  }
}

// 发送消息到飞书用户
export async function sendFeishuMessage(openId: string, message: any): Promise<boolean> {
  try {
    const accessToken = await getFeishuAccessToken();
    if (!accessToken) {
      console.error('无法获取飞书访问令牌');
      return false;
    }

    const response = await fetch(
      `${FEISHU_CONFIG.apiBaseUrl}/im/v1/messages?receive_id_type=open_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          receive_id: openId,
          msg_type: message.msg_type,
          content: JSON.stringify(message.card || message),
        }),
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      console.error('发送飞书消息失败:', data);
      return false;
    }

    console.log('飞书消息发送成功');
    return true;
  } catch (error) {
    console.error('发送飞书消息出错:', error);
    return false;
  }
}

// 发送卡片消息到飞书用户
export async function sendFeishuCard(openId: string, card: any): Promise<boolean> {
  return sendFeishuMessage(openId, {
    msg_type: 'interactive',
    card: card,
  });
}

// 通过 Webhook 发送消息（如果配置了 Webhook URL）
export async function sendFeishuWebhookMessage(message: any): Promise<boolean> {
  if (!FEISHU_CONFIG.webhookUrl) {
    console.error('未配置飞书 Webhook URL');
    return false;
  }

  try {
    const response = await fetch(FEISHU_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('飞书 Webhook 消息发送成功');
      return true;
    } else {
      const errorData = await response.json();
      console.error('飞书 Webhook 消息发送失败:', errorData);
      return false;
    }
  } catch (error) {
    console.error('发送飞书 Webhook 消息出错:', error);
    return false;
  }
}
