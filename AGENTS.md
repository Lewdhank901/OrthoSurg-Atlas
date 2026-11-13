# AGENTS.md

## 專案目的

OrthoSurg Atlas 提供骨科醫師術前快速複習與分階段教學。現有頁面包含 NexGen LCCK 翻修膝關節置換與 Trabecular Metal Total Ankle 全踝關節置換。LCCK 主流程採 Femoral Stem Base Instruments。不同器械的差異放在相關階段。內容從術前規劃至術畢確認，術後照護引用對應手冊章節。

## 網站與頁面規格

- 沿用深藍底及青綠重點色。手機用單欄與直向流程圖。保留鍵盤焦點樣式。
- 首頁顯示簡介、術式卡片與操作提示。卡片標示關節、術式及植入物系統。
- 術式頁依序顯示術式與器械範圍、原創流程圖、術前規劃、階段詳解、試模與最終確認、來源。
- 流程圖與詳解從同一份階段資料產生。詳解預設折疊，流程圖及確認摘要可跳到對應階段並展開。
- 正文使用繁體中文。主要器械保留原廠英文名稱，附一句中文用途。

## 內容格式

複製一份現有 JSON，再核對下列欄位。所有 slug 與階段 id 使用小寫英文、數字及連字號，階段 id 在同頁內唯一。

| 欄位 | 格式 |
|---|---|
| slug、title、region、system、summary | 術式識別名稱、中文術式、關節、植入物及器械系統、簡介 |
| planning | 三組 title、items。依序為影像與排列、植入物與器械、術前需討論的事項。items 為附引用的文字。 |
| steps | 依時間順序填 5–6 階段。每階段填 id、title、summary、purpose、instruments（name、use）、operations、checks、pitfalls、values、branches 及階段引用。 |
| pitfalls、values、branches | 附引用的文字陣列。每階段列手冊支持的檢查點。適用時填原廠關鍵數值及器械差異，可略去不適用的數值或分支。 |
| checks | 兩組 title、items，分為試模時確認、最終植入及術畢確認。每項填 text 與對應階段的 stage id。 |
| sources | title、section（文件編號及版本）、官方 HTTPS PDF url。 |
| postoperative | 有對應原廠章節時填引用。 |

引用填 pages（印刷頁碼或以 en dash 表示範圍）、pdfPage（PDF 檢視器起始頁序）、source（sources 從 1 起算的索引）。附引用文字另填 text。以 PDF 實際頁面核對印刷頁碼與檢視器頁序，因封面和目錄可能造成偏移。

## 檔案與開發

- 術式資料放在 `content/<slug>.json`，檔名與 slug 一致。指定 PDF 放在本機 `references/<slug>/`（既有資料夾為 LCCK 與 TAA），保留手冊原始檔名。Git 排除 `references/`。
- `build.mjs` 是首頁、流程圖和術式頁的共用版型。CSS 與互動程式在 `docs/assets/`。
- 執行 `node build.mjs` 產生 `docs/index.html` 和 `docs/procedures/<slug>/index.html`。從 JSON 或版型更新內容。網站由 GitHub Pages 的 docs 資料夾發布，站內連結使用相對路徑。

## AI 新增或修改流程

1. 先核對手冊封底文件編號、植入物、器械組及適用構型。按原廠流程整理，用自己的文字摘要。
2. 檢查點取自原廠手冊的注意事項、警語或 technique tips。關鍵數值附適用器械或構型、單位或原廠規格標示，以及精確頁碼。無法確認時先請專案作者核對。公開頁使用原創流程圖和獲授權素材。
3. 編輯來源檔後重建。確認首頁卡片、流程圖跳轉及展開、頁末確認連結、PDF 起始頁、鍵盤操作和手機寬度。驗證新增術式時用暫存資料，測完清除暫存內容及其產出，並重建正式首頁。

- 圖解子步驟依術式與階段存於 `content/illustrated-steps-data.mjs`，對應圖片存於 `docs/figures/<slug>/`。
- 本機開啟 `docs/index.html`。GitHub Pages 使用同一份 `docs/`。發布前確認原廠手冊連結能回傳 PDF，且跳頁位置與所引用的版次相符。
