# WebGL / XR Daily Samples

毎日の WebGL / GLSL / three.js / PlayCanvas / Babylon.js / XR / AR / VR リサーチから生成したサンプルを蓄積し、GitHub Pages で公開するための最小構成です。

## 含まれるもの

- `outputs/`
  - 日付ごとのサンプル HTML
- `days/`
  - 日付ごとの詳細ページ
- `pages/`
  - 一覧の2ページ目以降
- `index.html`
  - サンプル一覧トップページ
- `reports/`
  - 日次レポート本文を日付ページへ載せるための JSON
- `scripts/build-gallery.mjs`
  - `outputs/` と `reports/` を走査して `index.html` / `days/` / `pages/` を再生成
- `.github/workflows/deploy-pages.yml`
  - GitHub Pages へ自動デプロイする workflow
- `.nojekyll`
  - GitHub Pages の Jekyll 処理を無効化

## ローカルで一覧を再生成

```bash
npm run build:gallery
```

または:

```bash
node scripts/build-gallery.mjs
```

## サイト構成

- トップページ `index.html`
  - 各日付のカードが並ぶ
  - カードからその日の詳細ページへ移動
- 日付ページ `days/YYYY-MM-DD.html`
  - その日の概要
  - 必要なら日次レポート本文
  - サンプルへのリンクとプレビュー
- 一覧のページ送り `pages/2.html`, `pages/3.html`, ...
  - 件数が増えたら自動生成

## 日次レポート本文を載せる

`reports/YYYY-MM-DD.json` を追加すると、その日の詳細ページにレポート本文を表示できます。

例:

```json
{
  "date": "2026-06-30",
  "headline": "その日の見出し",
  "summary": "短い要約",
  "sections": [
    {
      "title": "今日の重要トピック",
      "body": "本文"
    }
  ]
}
```

## GitHub Pages で公開する手順

この実行環境では `.git` の新規作成権限がないため、ローカルで Git 初期化までは行っていません。
GitHub で始める場合は、手元でこのフォルダを Git リポジトリに取り込み、GitHub に push してください。

例:

```bash
cd /Users/nao/Documents/Codex/2026-06-10/webgl-xr-daily-report
git init -b main
git add .
git commit -m "Initial gallery site"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

その後 GitHub 側で:

1. リポジトリの `Settings`
2. `Pages`
3. `Build and deployment` の `Source` を `GitHub Actions` に設定

これで `.github/workflows/deploy-pages.yml` が使われ、push ごとに Pages が更新されます。

## 好きボタンについて

トップページの「好き」は `localStorage` 保存です。

- すぐ使える
- GitHub Pages 単体で動く
- ブラウザごとの保存

全ユーザー共通の `いいね数` を持たせるには、別途保存先や API が必要です。

## 今後の運用

毎日のサンプル追加後に、次を実行してください。

```bash
node scripts/build-gallery.mjs
```

日次 automation もこの再生成を前提に更新済みです。
