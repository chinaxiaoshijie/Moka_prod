import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class FeishuOAuthService {
  private readonly logger = new Logger(FeishuOAuthService.name);

  // In-memory store: state → userId (for OAuth flow tracking)
  private readonly pendingStates = new Map<string, { userId: string; createdAt: number }>();
  // In-memory store: state → openId (populated by callback)
  private readonly completedStates = new Map<string, { openId: string; name: string; avatarUrl?: string }>();

  // Clean up expired entries every 10 minutes
  private readonly STATE_TTL_MS = 10 * 60 * 1000;

  constructor(private configService: ConfigService) {
    // Periodic cleanup
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Generate OAuth state and associate with user
   */
  generateState(userId: string): string {
    const state = `feishu_bind_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this.pendingStates.set(state, { userId, createdAt: Date.now() });
    return state;
  }

  /**
   * Get Feishu OAuth authorization URL
   */
  getAuthorizeUrl(state: string): string {
    const appId = this.configService.get<string>("LARK_APP_ID");
    const redirectUri = this.configService.get<string>("FEISHU_OAUTH_REDIRECT_URI", "");

    if (!redirectUri) {
      this.logger.warn("FEISHU_OAUTH_REDIRECT_URI 未配置，飞书 OAuth 将失败");
    }

    const params = new URLSearchParams({
      app_id: appId!,
      redirect_uri: redirectUri,
      state,
    });

    return `https://passport.feishu.cn/suite/passport/oauth/authorize?${params.toString()}`;
  }

  /**
   * Verify state belongs to user
   */
  verifyState(state: string, userId: string): boolean {
    const entry = this.pendingStates.get(state);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > this.STATE_TTL_MS) {
      this.pendingStates.delete(state);
      return false;
    }
    return entry.userId === userId;
  }

  /**
   * Exchange authorization code for user_access_token, then get user info
   * Returns open_id (ou_xxx format)
   */
  async exchangeCode(code: string): Promise<{ openId: string; name: string; avatarUrl?: string } | null> {
    const appId = this.configService.get<string>("LARK_APP_ID");
    const appSecret = this.configService.get<string>("LARK_APP_SECRET");

    if (!appId || !appSecret) {
      this.logger.error("LARK_APP_ID or LARK_APP_SECRET not configured");
      return null;
    }

    try {
      // Step 1: Get app_access_token
      this.logger.log(`app_access_token request - appId: ${appId}, secret length: ${appSecret.length}`);
      const appTokenRes = await fetch("https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
        }),
      });

      let appTokenRaw: string;
      try {
        appTokenRaw = await appTokenRes.text();
      } catch {
        appTokenRaw = "(failed to read response)";
      }
      this.logger.log(`app_access_token response (${appTokenRes.status}): ${appTokenRaw.substring(0, 500)}`);
      const appTokenData = JSON.parse(appTokenRaw) as { code: number; app_access_token?: string; msg?: string };
      if (appTokenData.code !== 0) {
        this.logger.error(`获取 app_access_token 失败: ${JSON.stringify(appTokenData)}`);
        return null;
      }

      const appAccessToken = appTokenData.app_access_token!;

      // Step 2: Exchange code for user_access_token (Suite OAuth)
      this.logger.log(`user_access_token request - appId: ${appId}`);
      const userTokenRes = await fetch("https://passport.feishu.cn/suite/passport/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: appId,
          client_secret: appSecret,
          code,
          grant_type: "authorization_code",
        }),
      });

      const userTokenText = await userTokenRes.text();
      this.logger.log(`user_access_token response (${userTokenRes.status}): ${userTokenText.substring(0, 300)}`);

      if (userTokenRes.status !== 200) {
        this.logger.error(`获取 user_access_token 失败 (HTTP ${userTokenRes.status}): ${userTokenText}`);
        return null;
      }

      let userTokenData: any;
      try {
        userTokenData = JSON.parse(userTokenText);
      } catch (e) {
        this.logger.error(`user_access_token 响应非JSON: ${userTokenText}`);
        return null;
      }

      if (userTokenData.error) {
        this.logger.error(`获取 user_access_token 失败: ${JSON.stringify(userTokenData)}`);
        return null;
      }

      const userAccessToken = userTokenData.access_token || userTokenData.data?.access_token;
      if (!userAccessToken) {
        this.logger.error(`user_access_token 响应中无 access_token: ${JSON.stringify(userTokenData)}`);
        return null;
      }

      // Step 3: Get user info (Suite OAuth userinfo endpoint)
      this.logger.log(`userinfo request - token length: ${userAccessToken.length}`);
      const userInfoRes = await fetch("https://passport.feishu.cn/suite/passport/oauth/userinfo", {
        method: "GET",
        headers: { Authorization: `Bearer ${userAccessToken}` },
      });

      const userInfoText = await userInfoRes.text();
      this.logger.log(`userinfo response (${userInfoRes.status}): ${userInfoText.substring(0, 300)}`);

      if (userInfoRes.status !== 200) {
        this.logger.error(`获取用户信息失败 (HTTP ${userInfoRes.status}): ${userInfoText}`);
        return null;
      }

      let userInfoData: any;
      try {
        userInfoData = JSON.parse(userInfoText);
      } catch (e) {
        this.logger.error(`userinfo 响应非JSON: ${userInfoText}`);
        return null;
      }

      const openId = userInfoData.open_id || userInfoData.union_id || userInfoData.sub || "";
      const name = userInfoData.name || userInfoData.nickname || "";
      const avatarUrl = userInfoData.avatar_url || "";

      this.logger.log(`飞书 OAuth 成功 - openId=${openId}, name=${name}`);

      this.logger.log(`飞书 OAuth 成功 - openId=${openId}, name=${name}`);

      return { openId, name, avatarUrl };
    } catch (error) {
      this.logger.error(
        "飞书 OAuth 交换失败",
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * Store completed OAuth result (called by callback handler)
   */
  storeCompletedState(state: string, result: { openId: string; name: string; avatarUrl?: string }) {
    this.completedStates.set(state, result);
  }

  /**
   * Retrieve and consume completed OAuth result
   */
  consumeCompletedState(state: string) {
    const result = this.completedStates.get(state);
    if (result) {
      this.completedStates.delete(state);
      this.pendingStates.delete(state);
    }
    return result;
  }

  private cleanup() {
    const now = Date.now();
    for (const [state, entry] of this.pendingStates.entries()) {
      if (now - entry.createdAt > this.STATE_TTL_MS) {
        this.pendingStates.delete(state);
      }
    }
    for (const state of this.completedStates.keys()) {
      this.completedStates.delete(state);
    }
  }
}
