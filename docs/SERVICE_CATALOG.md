# 海外服务预设目录

v0.3.8 有 40 个独立服务开关、7 个分类。域名规则的唯一实现来源是 `src/core/rules/presets.ts`；本页说明选择依据、默认值和边界，不替代实际运行验证。

## 默认值与分流

Codex / OpenAI、Claude / Anthropic、开发者服务 / GitHub、Google / YouTube 保持默认开启，兼容既有保存设置。其余 36 个服务默认关闭；旧设置缺少新字段时也保持关闭。

常规模式中，既有 OpenAI 与 Claude 使用 `FORCE_PROXY`；既有 GitHub 与 Google / YouTube 继续使用可手动选择出口的 `PROXY`。所有新服务在启用后使用 `FORCE_PROXY`，避免在“指定服务使用 VPN IP”的场景中意外落到 `DIRECT`。默认直连模式里，所有已选服务都使用 `FORCE_PROXY`，其余流量由 `MATCH,DIRECT` 处理。

| 分类 | 服务 |
| --- | --- |
| AI 服务 | Codex / OpenAI、Claude / Anthropic、Perplexity、Grok |
| 社交与通讯 | X / Twitter、TikTok、Meta / Meta AI / Quest、Facebook、Instagram、Threads、Reddit、Telegram、WhatsApp、Discord、LinkedIn、Pinterest、Snapchat |
| 媒体与流媒体 | Google / YouTube、Netflix、Disney+、Prime Video、Spotify、Twitch |
| 工作与协作 | Microsoft、Apple / iCloud、Notion、Slack、Zoom、Dropbox、Figma、Adobe |
| 开发者服务 | GitHub、AWS 控制台、Cloudflare |
| 购物与支付 | Amazon 购物、PayPal、Stripe |
| 游戏 | Steam、Epic Games、Roblox |

Google Gemini 归入既有 Google / YouTube 开关，不另外创建重复开关。

Meta / Meta AI / Quest 开关覆盖 `meta.com`、`meta.ai` 和 `oculus.com`。Facebook、Instagram、Threads、WhatsApp 保持独立开关，避免只想代理 Meta 官网时扩大到全部社交应用。Meta 的[产品页面](https://www.meta.com/technologies/)列出这些独立应用，[Meta AI 官方页面](https://ai.meta.com/meta-ai)确认网页入口为 `meta.ai`，[Quest 开发文档](https://developers.meta.com/horizon/documentation/unity/ps-destinations-implementation/)仍使用 `oculus.com` 链接。

### v0.3.8 新增服务的域名边界

| 开关 | 域名范围 | 选择依据与边界 |
| --- | --- | --- |
| Amazon 购物 | `amazon.com` | [Amazon 主站](https://www.amazon.com/)；不自动包含各国家站点。域名后缀匹配也会覆盖 `aws.amazon.com` |
| AWS 控制台 | `aws.amazon.com`、`signin.aws`、`awsapps.com` | [AWS 登录文档](https://docs.aws.amazon.com/signin/latest/userguide/sign-in-urls-defined.html)；不包含承载客户服务的 `amazonaws.com` |
| Cloudflare | `cloudflare.com` | [Cloudflare 控制台](https://dash.cloudflare.com/)；开启后该公司域名下的挑战页面也会命中 |
| Figma | `figma.com`、`figmaweave.com` | [Figma 网络设置](https://help.figma.com/hc/en-us/articles/19424714305943-Adjust-your-network-settings)；不包含承载用户发布站点的 `figma.site` |
| Adobe | `adobe.com`、`adobe.io`、`adobelogin.com`、`adobe-identity.com`、`adobejanus.com`、`adobecc.com`、`adobeccstatic.com` | [Adobe 网络端点](https://helpx.adobe.com/business/enterprise/manage-services/configure-services/network-endpoints.html)的常用自有域名子集 |
| PayPal | `paypal.com`、`paypalobjects.com` | [PayPal 开发者文档](https://developer.paypal.com/platforms/checkout/fastlane/getstarted/) |
| Stripe | `stripe.com` | [Stripe 支付文档](https://docs.stripe.com/payments/finalize-payments-on-the-server)含 `js.stripe.com`；不扩到第三方商户域名 |
| Pinterest | `pinterest.com`、`pinimg.com` | [Pinterest 帮助](https://help.pinterest.com/en/article/discover-ideas-on-pinterest)与[官方图片数据集](https://github.com/pinterest/pinpoint-dataset) |
| Snapchat | `snapchat.com`、`snap.com`、`sc-cdn.net` | [Snap 网页分享](https://developers.snap.com/api/snapchat-for-web/social-plugins/share-link-to-snapchat)与[官方 CDN 文档](https://developers.snap.com/camera-kit/integrate-sdk/web/web-configuration) |
| Roblox | `roblox.com`、`rbxcdn.com` | [Roblox 网络说明](https://en.help.roblox.com/hc/en-us/articles/115005744663-Troubleshooting-Education-Networks)；原生游戏还会使用动态 IP 和 UDP |

## 域名选择方法

目录使用各服务的主站、登录/API、静态资源或服务自有 CDN 域名。规则通常是 `DOMAIN-SUFFIX`，使同一服务的子域一起匹配。共享基础设施只在明确属于某服务的主机时使用精确匹配；目录不会把 `cloudfront.net`、`amazonaws.com`、`akamaized.net` 或 `fastly.net` 这类承载其他客户服务的后缀加入独立预设。`cloudflare.com` 仅属于可选 Cloudflare 自身开关，不作为其他服务的公共匹配规则。

有些服务本身使用公司级域名空间，开启后会影响同一公司的其他访问：Microsoft 预设会匹配 Microsoft、Office、Outlook 与登录域名；Apple / iCloud 预设也会匹配 Apple 的非海外页面和服务；TikTok 的 `byteoversea.com` 可能承载其他 ByteDance 海外产品。它们仍是服务方域名，不是公共 CDN，但需要按实际用途选择。Threads 账户登录或内容嵌入可能请求 Instagram 域名；遇到这种情况请同时启用 Instagram，而不是扩大 Threads 规则到整个 Meta 域名空间。

本次清单以当前 [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community) 的独立服务数据为主要交叉来源，并人工收窄为核心运行域名，而不是直接导入完整远程列表。抽样核对的原始数据包括：[TikTok](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/tiktok)、[Discord](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/discord)、[Netflix](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/netflix)、[Spotify](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/spotify) 与 [Microsoft](https://raw.githubusercontent.com/v2fly/domain-list-community/master/data/microsoft)。Threads 同时采用 Meta 公布的 [threads.com 迁移说明](https://about.fb.com/news/2025/04/new-features-threads-web-experience/)。既有 AI 域名继续依据 [OpenAI 网络建议](https://help.openai.com/en/articles/9247338-network-recommendations-for-chatgpt-errors-on-web-and-apps) 与 [Claude Code 网络配置](https://code.claude.com/docs/en/network-config) 维护。

## 限制与维护

这不是任一服务的完整运行域名、支付域名、遥测域名或地区域名清单，也不保证登录、客户端下载、媒体播放或企业 SSO 在所有地区成功。服务可能新增域名、迁移 CDN 或使用共享第三方身份验证；遇到缺失时，先以客户端日志和实际请求主机确认，再补充最小的服务专属规则与测试。特别是 Telegram 原生客户端还会连接数据中心 IP；[其协议文档](https://core.telegram.org/api/datacenter)对此有说明。本目录仅处理可识别的域名请求，不加入推测性的 IP 段，因此不能保证覆盖原生客户端全部流量。

更新目录时应保留服务独立开关、默认值、分类和 DNS 对应关系；新服务默认关闭。不得为了提高命中率加入共享云/CDN 顶级后缀，也不得把用户节点、公司域名、账号标识或其他私有输入写入目录或测试。
