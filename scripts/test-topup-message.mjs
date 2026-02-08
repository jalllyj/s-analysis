// 测试飞书充值审核通知消息
async function testTopupMessage() {
  console.log('📤 正在测试充值审核通知消息...\n');

  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f';

  const topupMessage = {
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
            content: '**用户邮箱**: test@example.com\n**充值档位**: 经济包\n**积分数**: 50\n**金额**: ¥20.00\n**请求时间**: 2026-02-09 10:30:00\n**请求ID**: 123',
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
                content: '📋 前往审核',
              },
              type: 'primary',
              url: 'http://localhost:5000/admin/topup',
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
      body: JSON.stringify(topupMessage),
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      console.log('✅ 充值审核通知消息发送成功！');
      console.log('📱 请检查你的飞书群，应该能看到一条新的充值审核通知\n');
      console.log('🎉 现在可以正常使用飞书通知功能了！');
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

testTopupMessage();
