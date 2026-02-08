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

  // 应用访问地址（用于按钮链接）
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',

  // 飞书API基础URL
  apiBaseUrl: 'https://open.feishu.cn/open-apis',
};

// 充值审核通知消息模板（交互式版本）
export function createTopupApprovalMessage(data: {
  requestId: number;
  email: string;
  tierName: string;
  credits: number;
  price: string;
  receiptUrl?: string;
  createdAt: Date;
}) {
  const approveUrl = `${FEISHU_CONFIG.appUrl}/quick-topup/${data.requestId}?action=approve`;
  const rejectUrl = `${FEISHU_CONFIG.appUrl}/quick-topup/${data.requestId}?action=reject`;
  const adminUrl = `${FEISHU_CONFIG.appUrl}/admin/topup`;

  return {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: '💰 新的充值审核请求',
        },
        template: 'orange',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: `**用户邮箱**: ${data.email}\n**充值档位**: ${data.tierName}\n**积分数**: ${data.credits}\n**金额**: ¥${data.price}\n**请求时间**: ${data.createdAt.toLocaleString('zh-CN')}\n**请求ID**: ${data.requestId}`,
          },
        },
        {
          tag: 'hr',
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '✅ 通过',
              },
              type: 'primary',
              url: approveUrl,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '❌ 拒绝',
              },
              type: 'danger',
              url: rejectUrl,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '📋 查看详情',
              },
              url: adminUrl,
            },
          ],
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: '💡 隧道密码: 115.190.93.94 (首次访问时需要输入)',
            },
          ],
        },
      ],
    },
  };
}

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
