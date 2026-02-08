import { NextRequest, NextResponse } from 'next/server';
import { FEISHU_CONFIG } from '@/lib/feishu';
import { SignJWT, jwtVerify } from 'jose';

// 飞书 OAuth 回调处理
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { error: '缺少授权码' },
        { status: 400 }
      );
    }

    // 1. 使用 code 获取 access_token
    const tokenResponse = await fetch(
      `${FEISHU_CONFIG.apiBaseUrl}/authen/v1/oidc/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: FEISHU_CONFIG.appId,
          client_secret: FEISHU_CONFIG.appSecret,
          code: code,
          redirect_uri: FEISHU_CONFIG.oauthRedirectUri,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.code !== 0) {
      console.error('飞书获取 token 失败:', tokenData);
      return NextResponse.json(
        { error: '获取访问令牌失败' },
        { status: 500 }
      );
    }

    const { access_token } = tokenData.data;

    // 2. 使用 access_token 获取用户信息
    const userResponse = await fetch(
      `${FEISHU_CONFIG.apiBaseUrl}/authen/v1/user_info`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    const userData = await userResponse.json();

    if (userData.code !== 0) {
      console.error('飞书获取用户信息失败:', userData);
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      );
    }

    const { open_id, name, en_name, avatar_url } = userData.data;

    // 3. 生成 JWT token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    );

    const token = await new SignJWT({
      userId: open_id,
      openId: open_id,
      name: name || en_name || '飞书用户',
      avatar: avatar_url,
      role: 'admin', // 飞书应用用户默认为管理员
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // 4. 将 token 存储到 cookie 并重定向
    const redirectUrl = state || '/admin/topup';

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    });

    return response;
  } catch (error) {
    console.error('飞书 OAuth 回调处理失败:', error);
    return NextResponse.json(
      { error: '处理失败' },
      { status: 500 }
    );
  }
}
