// 测试更新后的飞书消息（使用新的 quick-topup 路径）
async function testUpdatedMessage() {
  console.log('📤 正在测试更新后的飞书消息...\n');

  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f';
  const appUrl = 'http://9.129.6.176:5000';

  const updatedMessage = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: '💰 充值审核（已更新）',
        },
        template: 'orange',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '**测试充值信息**\n用户邮箱: test@example.com\n充值档位: 经济包\n积分数: 50\n金额: ¥20.00\n请求时间: 2026-02-09 10:30:00\n请求ID: 888',
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
              url: `${appUrl}/quick-topup/888?action=approve`,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '❌ 拒绝',
              },
              type: 'danger',
              url: `${appUrl}/quick-topup/888?action=reject`,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '📋 查看详情',
              },
              url: `${appUrl}/admin/topup`,
            },
          ],
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: '💡 已更新移动端友好页面，首次使用需要登录一次',
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedMessage),
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      console.log('✅ 更新后的消息已发送！');
      console.log('');
      console.log('📱 请检查飞书群，点击按钮测试：');
      console.log('');
      console.log('🎯 新功能特性：');
      console.log('  - 移动端友好设计');
      console.log('  - 自动登录检测');
      console.log('  - 友好的错误提示');
      console.log('  - 显示充值详情');
      console.log('');
      console.log('📝 使用步骤：');
      console.log('  1. 点击"✅ 通过"或"❌ 拒绝"按钮');
      console.log('  2. 如果未登录，会提示登录');
      console.log('  3. 登录后自动返回审核页面');
      console.log('  4. 完成审核');
      console.log('');
      console.log('🌐 注意：如果手机无法访问，请使用 ngrok 获得公网地址');
    } else {
      console.log('❌ 消息发送失败');
      console.log('响应状态:', response.status);
      console.log('响应数据:', data);
    }
  } catch (error) {
    console.error('❌ 测试出错:', error);
  }

  process.exit(0);
}

testUpdatedMessage();
