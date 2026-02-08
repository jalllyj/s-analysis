// 测试新的交互式飞书消息
async function testInteractiveMessage() {
  console.log('📤 正在测试新的交互式飞书消息...\n');

  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f';
  const appUrl = 'http://9.129.6.176:5000';

  const interactiveMessage = {
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
            content: '**用户邮箱**: test@example.com\n**充值档位**: 经济包\n**积分数**: 50\n**金额**: ¥20.00\n**请求时间**: 2026-02-09 10:30:00\n**请求ID**: 999',
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
              url: `${appUrl}/api/admin/topup/999/approve?action=approve`,
            },
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '❌ 拒绝',
              },
              type: 'danger',
              url: `${appUrl}/api/admin/topup/999/reject?action=reject`,
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
              content: '💡 提示：点击"通过"或"拒绝"按钮可直接完成审核',
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
      body: JSON.stringify(interactiveMessage),
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      console.log('✅ 交互式消息已发送！');
      console.log('');
      console.log('📱 请检查飞书群，你将看到：');
      console.log('  - ✅ 通过 按钮（绿色）');
      console.log('  - ❌ 拒绝 按钮（红色）');
      console.log('  - 📋 查看详情 按钮');
      console.log('');
      console.log('🎯 测试步骤：');
      console.log('1. 在飞书App中点击"✅ 通过"按钮');
      console.log('2. 如果已登录，会直接通过审核');
      console.log('3. 如果未登录，会提示先登录');
      console.log('');
      console.log('📲 手机版飞书同样支持！');
      console.log('');
      console.log('🎉 交互式审核功能已就绪！');
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

testInteractiveMessage();
