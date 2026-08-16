# UIリッチ化・デザインリニューアル 設計書

## 背景・目的

現状の4画面（トップ / お問い合わせフォーム / 一覧 / 詳細）は、機能実装を優先したミニマルなスタイル（`border`と`rounded`程度）のみで構成されている。機能が一通り揃った（Task 1〜13完了）タイミングで、UI/UXをリッチでモダンなデザインに刷新する。

## デザイン方向性

「Linear/Notion的な余白の広いビジネス感」と「Stripeダッシュボード的な角丸カード・淡いグラデーション・カラーバッジ」を半々でブレンドしたハイブリッドスタイルを採用する。

- **カラー**：ベースはTailwind標準グレースケール（`gray-50`〜`gray-900`）。アクセントカラーはインディゴ〜バイオレット系（`indigo-600`中心）
- **ダークモード**：非対応（ライトモードのみ、スコープ外）
- **レスポンシブ**：デスクトップ利用を主眼とし、スマホ幅は最低限の崩れ防止のみ（テーブルの横スクロール許容。カード型への組み替えは行わない）
- **アイコン**：`lucide-react` を新規導入する（軽量・Tree-shaking対応のReact向けアイコンライブラリ）
- **フォント**：既存の `Geist` / `Geist Mono` を維持（変更なし）

## 共通コンポーネント（`app/_components/`）

既存の `StatusBadge` に加えて、以下を新規追加する。2画面以上から使う共通パーツのみをここに置き、特定画面でしか使わないものは各画面の `_components/` に置く（既存の co-location 方針を踏襲）。

### `Button.tsx`
- `variant: "primary" | "secondary"` の2バリアント
- primary: `bg-indigo-600 text-white hover:bg-indigo-700`
- secondary: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`
- 共通: `rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-50`
- 既存の `<button>` 直書き箇所（`ContactForm`の送信ボタン等）はこれに置き換える

### `Card.tsx`
- `rounded-xl border border-gray-200 bg-white p-6 shadow-sm`
- `hoverable?: boolean` prop で `hover:shadow-md hover:-translate-y-0.5 transition` を付与するかを切り替える（トップページのリンクカードで使用）

### `PageHeader.tsx`
- 管理画面（`/inquiries` 系）専用の共通ヘッダー
- 左：indigoの角丸アイコンバッジ（`Inbox`アイコン）＋システム名（トップページへの `Link`）
- 右：`backHref` / `backLabel` を props で受け取り、一覧では「一覧」表示、詳細では「← 一覧に戻る」を表示する
- `border-b border-gray-200 bg-white/80 backdrop-blur` のバー

### `StatusBadge.tsx`（更新）
- 配色を「ソフトトーン＋輪郭」に変更：`bg-{color}-50 text-{color}-700 ring-1 ring-{color}-600/20`
- ステータスと色の対応（open=gray, in_progress=blue, pending=yellow, closed=green）は現状を維持

## 画面ごとの設計

### トップページ（`app/page.tsx`）

- 背景：`bg-gradient-to-b from-indigo-50 via-white to-white`
- 中央寄せのヒーロー：アイコンバッジ＋大見出し（`text-4xl font-bold tracking-tight`）＋一言サブコピー
- その下に2枚の`Card`（`hoverable`）を `grid grid-cols-1 sm:grid-cols-2 gap-6` で配置
  - 「お問い合わせ一覧」：`Inbox`アイコン、タイトル、説明文、右下に`ArrowRight`アイコン
  - 「お問い合わせフォーム」：`MessageSquarePlus`アイコン、タイトル、説明文、右下に`ArrowRight`アイコン

### お問い合わせフォーム（`app/contact/page.tsx`, `app/contact/_components/ContactForm.tsx`）

- 背景：トップページと同じグラデーション
- フォーム全体を1枚の`Card`（`max-w-xl`）に収める。上部に見出し＋一言案内文
- 各入力欄：`label`は`text-sm font-medium text-gray-700`、`input`/`textarea`は`rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500`
- 送信ボタン：共通`Button`（`variant="primary"`）、`w-full`
- 送信完了時：`Card`＋`CheckCircle`アイコン＋見出し＋「続けて問い合わせる」ボタン（`variant="secondary"`）に変更（現状の緑背景ボックスから置き換え）

### 一覧画面（`app/inquiries/page.tsx`, `_components/InquiryFilter.tsx`, `_components/InquiryTable.tsx`）

- `app/inquiries/layout.tsx` を新規作成し、`PageHeader`（`backHref`なし、通常表示）を配置
- 見出し「お問い合わせ一覧」の横に件数を表示
- `InquiryFilter` を`Card`で囲み、セレクトボックスを`rounded-lg border-gray-300 focus:border-indigo-500`に統一
- `InquiryTable` を`Card`で囲む
  - ヘッダー行：`bg-gray-50 text-xs uppercase tracking-wide text-gray-500`
  - 行区切り：`divide-y divide-gray-100`
  - 行ホバー：`hover:bg-indigo-50/50`
  - ステータスは更新後の`StatusBadge`、担当者未割り当ては`text-gray-400`
- 0件時：アイコン（`Inbox`）＋「該当するお問い合わせがありません」の空状態を表示

### 詳細画面（`app/inquiries/[id]/page.tsx`, 配下の`_components/*`）

- `app/inquiries/layout.tsx`の`PageHeader`を共有し、`backHref="/inquiries"` / `backLabel="一覧に戻る"` を渡す。ページ本体にあった既存の「← 一覧に戻る」リンクは削除しヘッダーに統合する
- `InquiryDetailCard`：`Card`化。件名を大見出し（`text-xl font-bold`）、ステータスバッジを右上に配置、送信者情報（名前・メール・受付日時）をラベル付きで整理
- 「対応」セクション：`Card`化。内部を`grid grid-cols-1 sm:grid-cols-3 gap-4`に変更（現状の`flex flex-wrap`から変更）し、担当者切替・ステータス変更・担当者割り当てを整理して配置
- 「対応履歴」（`HistoryTimeline`）：左に縦線＋丸ドットのタイムライン装飾を追加し、右にイベント内容とタイムスタンプを表示

## 影響範囲・変更ファイル一覧

**新規作成**
- `app/_components/Button.tsx`
- `app/_components/Card.tsx`
- `app/_components/PageHeader.tsx`
- `app/inquiries/layout.tsx`

**変更**
- `app/page.tsx`
- `app/contact/page.tsx`
- `app/contact/_components/ContactForm.tsx`
- `app/inquiries/page.tsx`
- `app/inquiries/_components/InquiryFilter.tsx`
- `app/inquiries/_components/InquiryTable.tsx`
- `app/inquiries/[id]/page.tsx`
- `app/inquiries/[id]/_components/InquiryDetailCard.tsx`
- `app/inquiries/[id]/_components/HistoryTimeline.tsx`
- `app/_components/StatusBadge.tsx`
- `package.json`（`lucide-react`追加）

## スコープ外

- ダークモード対応
- スマホ幅でのテーブルのカード型組み替え（横スクロールで代替）
- 機能面の変更（バリデーション・API仕様・状態遷移ロジックなどは一切変更しない。見た目とマークアップ構造のみ変更する）

## 検証方法

```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
```

加えて、ブラウザで4画面（`/`, `/contact`, `/inquiries`, `/inquiries/[id]`）を開き、見た目の崩れがないこと、既存の機能（送信・絞り込み・ステータス変更・担当者割り当て・対応メモ投稿）が引き続き動作することを確認する。
