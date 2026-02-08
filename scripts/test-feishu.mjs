// 测试飞书 Webhook 配置
async function testFeishuWebhook() {
  console.log('📤 正在测试飞书 Webhook 配置...\n');

  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f';

  const testMessage = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: '🎉 飞书配置测试成功',
        },
        template: 'green',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '**测试消息内容**\n\n飞书 Webhook 配置已成功！\n\n当用户提交充值请求时，系统会自动发送类似的消息到此群。\n\n**功能说明**：\n- 用户提交充值请求 → 飞书收到通知 → 管理员审核 → 积分到账',
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
                content: '📋 前往管理后台',
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
      body: JSON.stringify(testMessage),
    });

    const data = await response.json();

    if (response.ok && data.code === 0) {
      console.log('✅ 飞书消息发送成功！');
      console.log('📱 请检查你的飞书群，应该能看到测试消息\n');
      console.log('🎉 配置完成，系统已经可以使用飞书通知功能了！');
    } else {
      console.log('❌ 飞书消息发送失败');
      console.log('响应状态:', response.status);
      console.log('响应数据:', data);
      console.log('\n请检查：');
      console.log('1. Webhook URL 是否正确');
      console.log('2. 飞书机器人是否还在群中');
      console.log('3. 网络连接是否正常');
    }
  } catch (error) {
    console.error('❌ 测试出错:', error);
  }

  process.exit(0);
}

testFeishuWebhook();
