// 测试修复后的飞书消息链接
async function testFixedMessage() {
  console.log('📤 正在测试修复后的飞书消息链接...\n');

  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/0e1f2e46-0f44-4dff-ac55-c6ffb12ee77f';

  const topupMessage = {
    msg_type: 'interactive',
    card: {
      header: {
        title: {
          tag: 'plain_text',
          content: '🔧 飞书链接已修复',
        },
        template: 'green',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '之前的 localhost 链接已修复为本机IP地址，现在可以在任何设备上访问管理后台了！\n\n**测试信息**：\n- 用户邮箱: test@example.com\n- 充值档位: 经济包\n- 积分数: 50\n- 金额: ¥20.00',
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
              url: 'http://9.129.6.176:5000/admin/topup',
            },
          ],
        },
        {
          tag: 'note',
          elements: [
            {
              tag: 'plain_text',
              content: '💡 提示：现在可以在手机或其他设备上点击此按钮访问管理后台',
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
      console.log('✅ 修复后的消息已发送！');
      console.log('📱 请检查飞书群，点击"前往管理后台"按钮\n');
      console.log('🌐 新的访问地址：http://9.129.6.176:5000/admin/topup');
      console.log('');
      console.log('🎉 现在可以在任何设备上访问了！');
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

testFixedMessage();
