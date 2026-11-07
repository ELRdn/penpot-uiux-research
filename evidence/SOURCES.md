# 出典・証拠一覧

実施日: 2026-11-06。すべて読み取り専用の観測。

## A. 観測したページ

| # | URL | 内容 | 取得方法 |
|---|---|---|---|
| A1 | https://penpot.app/ | ホーム | REA `inspect_web_page` + CDP キャプチャ |
| A2 | https://penpot.app/features | 機能一覧（タブ UI） | CDP キャプチャ + DOM 実測 |
| A3 | https://penpot.app/pricing | 価格・比較表・FAQ | REA `inspect_web_page` + CDP |
| A4 | https://penpot.app/ai/ai-workflows | AI ワークフロー | CDP キャプチャ |
| A5 | https://design.penpot.app/ | ログイン（`?screen=auth-login`） | REA `inspect_web_page` + CDP |
| A6 | https://design.penpot.app/#/auth/register | 登録 | CDP キャプチャ |
| A7 | https://help.penpot.app/ | ヘルプセンター | CDP キャプチャ + 監査スクリプト |
| A8 | https://help.penpot.app/user-guide/ | ユーザーガイド索引 | CDP テキスト抽出 |
| A9 | https://help.penpot.app/user-guide/first-steps/ | First Steps | CDP キャプチャ |
| A10 | https://help.penpot.app/user-guide/first-steps/the-interface/ | Interface tour（20領域の定義） | CDP キャプチャ + テキスト抽出 |
| A11 | https://community.penpot.app/ | コミュニティ（Discourse） | CDP キャプチャ |
| A12 | https://penpot.app/this-page-does-not-exist-xyz | 404 の挙動確認 | CDP キャプチャ |

## B. 公式ドキュメント内の画像（二次資料として引用）

| # | URL | 内容 |
|---|---|---|
| B1 | https://help.penpot.app/img/interface/workspace-dark.webp | Workspace の注釈付き全体図 |
| B2 | https://help.penpot.app/img/interface/dashboard-dark.webp | Dashboard の注釈付き全体図 |
| B3 | https://help.penpot.app/img/interface/viewmode-dark.webp | View mode の注釈付き全体図 |

## C. ソースコード（デザイントークン）

| # | リポジトリ / パス | 内容 |
|---|---|---|
| C1 | https://github.com/penpot/penpot | 本体（MPL 2.0） |
| C2 | `frontend/resources/styles/common/refactor/design-tokens.scss` | コンポーネントトークン 339 個 |
| C3 | `frontend/resources/styles/common/refactor/color-defs.scss` | プリミティブ色 |
| C4 | `frontend/resources/styles/common/refactor/fonts.scss` | タイプスケール（10–36rem / 400・500・700 / 1.5） |
| C5 | `frontend/resources/styles/common/refactor/spacing.scss` | 4px 基底の余白 |
| C6 | `frontend/resources/styles/common/refactor/borders.scss` | 角丸 9 種 |
| C7 | `frontend/resources/styles/common/refactor/z-index.scss` | z-index 定義 |
| C8 | `frontend/resources/styles/common/refactor/focus.scss` | `:focus-visible` の実装 |
| C9 | `frontend/resources/styles/common/refactor/themes.scss` | dark / light テーマ |

取得方法: `git clone --depth 1 --filter=blob:none --sparse` + `git sparse-checkout set frontend/resources/styles`。

## D. REA Evidence

`evidence/rea-evidence-bundle.json`（6 レコード、1.99 MB）

| Evidence ID | 操作 | 対象 | 信頼度 |
|---|---|---|---|
| `ev_173c55b05fb0465f0fd75a8ddab10ab1b359abea03b9839dcec50756d003b5dc` | inspect_web_page | https://penpot.app/ | observed |
| `ev_24f8743f8fc9d9567027bfa0d1680e0f94eab874d11b66be91ef7002dfba8afe` | capture_web_screenshot | https://penpot.app/ | observed |
| `ev_5e6f387381f3878f9e0e5fdbb52572e53532a969bd56f4eca8ef0c5d0e1b194c` | inspect_web_page | https://design.penpot.app/ | observed |
| `ev_9b305e1e25648b1b1e5239d8d5a2a3e1419fc43de941f74acb727a2e626076af` | inspect_web_page | https://penpot.app/pricing | observed |
| `ev_9f2335772e41e1caed83d76b63d7b4a6f4cf9a2c8c28aa512dd33066894f5ac1` | capture_web_screenshot | https://penpot.app/ | observed |
| `ev_db73c78fd7d9ae5650deea1b5979827281c755ae08f622106e093f24ae2ff87a` | capture_web_screenshot | https://penpot.app/ | observed |

REA の制約（そのまま記録）:
- 観測はアタッチ後のみ。ページ読み込み前の通信・コンソールは取得できない
- 生のヘッダ・ボディ・Cookie・ストレージ値は保持されない
- スクリーンショットはビューポートのみ。REA はスクロール・JS 実行・画面遷移を行わない

## E. 自作の計測データ

| ファイル | 内容 |
|---|---|
| `evidence/audit-home.json` | 見出し構造・alt・コントラスト・タップ領域・色・フォント |
| `evidence/audit-features.json` | 同上 |
| `evidence/audit-pricing.json` | 同上 |
| `evidence/audit-help.json` | 同上 |
| `evidence/audit-app-login.json` | 同上 |

計測スクリプト: `scripts/audit.js`（DOM と computed style を読み、コントラスト比を WCAG 式で計算）。
キャプチャ: `scripts/cdp.mjs`（Chrome DevTools Protocol を直接操作。Cookie バナーを閉じ、遅延読み込みを発火させてから撮影）。

## F. 未取得・未検証

- エディタ内部（要認証）。アカウントは作成していない
- スクリーンリーダーによる実読上げ
- キーボード操作の通し検証
- Core Web Vitals（LCP / CLS / INP）
- サーバーサイドの A/B テスト設定
