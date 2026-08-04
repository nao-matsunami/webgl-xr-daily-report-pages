# WebGL / Shader Daily Samples

毎日の WebGL / GLSL / three.js / PlayCanvas / Babylon.js リサーチから生成したサンプルを蓄積し、GitHub Pages で公開するための最小構成です。役割は `シェーダー / WebGL / 視覚表現` 寄りのデイリー実験集です。

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

GitHub Pages 公開用リポジトリへ反映する場合:

```bash
npm run publish:pages
```

このコマンドは `pages.config.json` を参照し、`writable workspace` 内の Pages repo clone を更新対象として扱います。

- source repo 側で実行した場合
  - `pagesCloneDir` に Pages repo clone が無ければ自動で clone
  - source repo の内容を clone 側へ同期
  - clone 側で `build:gallery`、`git add`、`commit`、`push`
- Pages repo clone 側で実行した場合
  - その場で `build:gallery`、`git add`、`commit`、`push`

hardcoded な外部パスへのコピーには依存しません。

## 毎朝の自動レポートをサイトへ反映する

日次レポート JSON を保存し、そのまま一覧再生成と GitHub Pages 公開まで流す場合:

```bash
node scripts/upsert-report.mjs --file reports/2026-06-30.json --publish
```

JSON を標準入力で渡す場合:

```bash
cat /tmp/report.json | node scripts/upsert-report.mjs --stdin --publish
```

この処理で次の3つをまとめて行います。

1. `reports/YYYY-MM-DD.json` を保存または更新
2. `index.html` / `days/` / `pages/` を再生成
3. GitHub Pages 公開用リポジトリへ push

日次 automation 側でこの形式の JSON を出せるようにしておけば、毎朝のレポート公開まで一気通しで進められます。

## Pages repo clone の設定

公開先 repo は `pages.config.json` で指定します。

```json
{
  "pagesRepoUrl": "https://github.com/nao-matsunami/webgl-xr-daily-report-pages.git",
  "pagesCloneDir": ".pages-repo"
}
```

標準では、source repo の直下に `.pages-repo/` を作り、そこを publish 対象として使います。

初回 clone だけ先に明示したい場合:

```bash
git clone https://github.com/nao-matsunami/webgl-xr-daily-report-pages.git .pages-repo
```

source repo が sandbox 制約で書き込みづらい場合は、`.pages-repo/` 側へ直接 `reports/YYYY-MM-DD.json` と `outputs/YYYY-MM-DD_*.html` を追加し、そのディレクトリで `npm run publish:pages` を実行してください。

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

## GitHub Pages で公開する前提

公開用 repo には GitHub Pages workflow が入っている前提です。publish 後は Pages repo 側の `push` を起点にデプロイされます。

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
