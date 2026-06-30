# reports

このフォルダに `YYYY-MM-DD.json` を置くと、一覧カードから遷移した日別ページに、その日のレポート本文を表示できます。

ひな形は [`template.json`](/Users/nao/Documents/Codex/2026-06-10/webgl-xr-daily-report/reports/template.json) を使えます。

最小構成の例:

```json
{
  "date": "2026-06-30",
  "headline": "HTML-in-Canvas と焦点面演出の整理",
  "headlineEn": "HTML-in-Canvas and rack-focus staging",
  "summary": "その日の要点を短くまとめた文。",
  "summaryEn": "Short English summary.",
  "links": [
    { "label": "three.js r185", "url": "https://github.com/mrdoob/three.js/releases/tag/r185" }
  ],
  "sections": [
    {
      "title": "今日の重要トピック",
      "titleEn": "Key topics today",
      "body": "段落本文",
      "bodyEn": "English paragraph.",
      "links": [
        { "label": "公式リンク", "url": "https://example.com" }
      ]
    }
  ]
}
```

`sections` は上から順に表示されます。  
リンクは `links` 配列で追加できます。

英語も出したい場合は `headlineEn`, `summaryEn`, `titleEn`, `bodyEn` を追加してください。
