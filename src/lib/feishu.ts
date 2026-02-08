// 飞书应用配置
export const FEISHU_CONFIG = {
  // 飞书 App ID（从飞书开放平台获取）
  appId: process.env.FEISHU_APP_ID || '',

  // 飞书 App Secret（从飞书开放平台获取）
  appSecret: process.env.FEISHU_APP_SECRET || '',

  // 审核群机器人 Webhook URL（可选，如果使用机器人推送）
  webhookUrl: process.env.FEISHU_WEBHOOK_URL || '',

  // 接收审核通知的用户ID（可选）
  adminOpenId: process.env.FEISHU_ADMIN_OPEN_ID || '',

  // 飞书API基础URL
  apiBaseUrl: 'https://open.feishu.cn/open-apis',
};



// 审核结果通知消息模板
export function createTopupResultMessage(data: {
  requestId: number;
  status: 'approved' | 'rejected';
  credits?: number;
  adminRemark?: string;
}) {
  const isApproved = data.status === 'approved';
  const title = isApproved ? '✅ 充值审核通过' : '❌ 充值审核被拒绝';
  const template = isApproved ? 'green' : 'red';

  let content = `**请求ID**: ${data.requestId}\n`;
  content += `**状态**: ${isApproved ? '已通过' : '已拒绝'}\n`;
  if (data.credits !== undefined) {
    content += `**充值积分数**: ${data.credits}\n`;
  }
  if (data.adminRemark) {
    content += `**管理员备注**: ${data.adminRemark}\n`;
  }

  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: title,
        },
        template: template,
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: content,
          },
        },
      ],
    },
  };
}
