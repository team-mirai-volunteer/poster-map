# poster-map
## アプリケーション概要
* 選挙の際にポスターを貼るべき看板の位置を登録し、自陣営のポスター貼付け状況を管理できるシステムです
* 2024年東京都知事選で安野たかひろ陣営が運用していたシステムをオープンソースとして公開可能な形に調整したものです
* 都知事選での運用の詳細は[こちらのnote記事](https://note.com/annotakahiro24/n/nb7c6d5d5f172)をご確認ください。

## ライセンスについて
* このプロジェクトは[GPL-3.0 license](https://github.com/takahiroanno2024/anno-ai-avatar?tab=GPL-3.0-1-ov-file)にて公開されています。
* ただし、自治体などの組織が利用する時、調整が必要な場合には個別にご相談ください。
* 相談する場合は takahiroanno2024@gmail.com にご連絡ください。

## コントリビュートについて
* プロジェクトへのコントリビュートの際には、[コントリビューターライセンス契約（CLA）](https://github.com/takahiroanno2024/poster-map/blob/main/CLA.md)への同意が必須となります。ご了承ください。


## 動作サンプル
https://anno-poster-map.netlify.app/

## サイトマップ
- `/`: トップページ（各ポスターマップへのメニュー）
- `/map`: ポスターマップ
    - `?block=BLOCKNAME` とパラメータを設定することで、特定の地区のみ表示可能
    - `23-city`, `23-east`, `23-west`, `tama-north`, `tama-south`, `tama-west`, `island`
- `/summary`: 市区町村ごとの完了率をヒートマップとして可視化したマップ
- `/vote`: 期日前投票所のみを表示したマップ

## 環境変数とAPI キー管理

### 概要
このプロジェクトでは、Google Spreadsheet APIやその他の外部サービスのAPI キーを安全に管理するために、環境変数を使用することを強く推奨します。

### セットアップ手順

#### 1. .envファイルの作成
プロジェクトのルートディレクトリに`.env`ファイルを作成し、API キーや機密情報を記載します：

```bash
# .env ファイルの例
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/path/to/service-account-key.json
NETLIFY_AUTH_TOKEN=your_netlify_auth_token_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
DATABASE_URL=your_database_connection_string_here
```

#### 2. .gitignoreの設定
`.env`ファイルがGitリポジトリにコミットされないよう、`.gitignore`に追加します：

```gitignore
# 環境変数ファイル
.env
.env.local
.env.production
.env.staging

# Google Service Account キー
*.json
service-account-*.json
```

#### 3. python-dotenvのインストール
Pythonスクリプトで環境変数を読み込むために`python-dotenv`をインストールします：

```bash
pip install python-dotenv
```

#### 4. Pythonスクリプトでの使用方法
スクリプトの冒頭で環境変数を読み込みます：

```python
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込み
load_dotenv()

# 環境変数の取得
api_key = os.environ.get('GOOGLE_SHEETS_API_KEY')
service_account_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY_PATH')
openrouter_key = os.environ.get('OPENROUTER_API_KEY')

# 必須の環境変数チェック
if not api_key:
    raise ValueError("GOOGLE_SHEETS_API_KEY環境変数が設定されていません")
if not openrouter_key:
    raise ValueError("OPENROUTER_API_KEY環境変数が設定されていません")
```

#### 5. セキュリティのベストプラクティス
- **絶対にAPI キーをコードに直接記載しない**
- **本番環境では環境変数を直接設定する**（.envファイルは開発環境のみ）
- **定期的にAPI キーをローテーションする**
- **最小権限の原則に従ってAPI キーの権限を設定する**

#### 6. 本番環境での設定例
本番環境（サーバーやCI/CD）では、以下のように環境変数を直接設定します：

```bash
# Linux/macOS
export GOOGLE_SHEETS_API_KEY="your_api_key_here"

# systemdサービスファイル
Environment=GOOGLE_SHEETS_API_KEY=your_api_key_here

# cronジョブ
*/5 * * * * GOOGLE_SHEETS_API_KEY=your_api_key_here /path/to/script.py
```

## 環境
- Google Spreadsheet / Google Apps Script
    - 掲示板の位置情報/貼り付け状況を管理するデータベースとして使用
    - Google Apps Script (GAS)を使用し、シート内のデータをCSVとしてWeb公開
- 定期実行サーバ
    - GASで公開したCSVを加工/集計してJSONを生成するのに使用
    - Pythonが使える環境 (Linux, macOS, WSL2等を推奨)
    - クラウド上のインスタンスでも、オンプレミスの物理マシンでもOK（重い処理はないのでRaspberry Piなどで良い）
- Netlify
    - https://anno-poster-map.netlify.app といったURLで、Webサービスを公開できる (基本的に無料で利用可能)
    - `netlify-cli`を使ってサーバーからNetlifyに`public/`ディレクトリを直接デプロイ

## 公開データ
- `data/arealist.json`: 市区町村名とそれに対応するID一覧 (JSON)
- `data/all.csv`: 全掲示板データ(CSV)
    - 取得元はGoogle Spreadsheet (Google Apps ScriptでCSVとしてWebに公開)
    - このCSVを各種スクリプトで加工することで、配信用のJSON(`all.json`, `summary.json`など)を生成している
    - 列
        - `area`: 地区名
        - `name`: 掲示板番号
        - `lat`: 緯度
        - `long`: 軽度
        - `status`: 0 (未), 1 (完了), 2 (異常), 3 (予約), 4 (要確認), 5 (異常対応中), 6 (削除)
        - `note`: 備考（ピンの吹き出しに表示される）
```csv
area,name,lat,long,status,note
北区,1-1,35.737156,139.757525,1,
北区,1-2,35.7347132,139.7590379,2,他候補貼り間違え
北区,1-3,35.7343472,139.7612792,0,
```
- `data/all.json`: 全掲示板データ(JSON)
- `data/summary.json`: 市区町村別の貼り付け完了率 (JSON)
- `data/summary_absolute.json`: 市区町村別の未貼り付け掲示板数（絶対数） (JSON)
- `data/vote_venue.json`: 期日前投票所位置データ (JSON)

## スクリプト
- `csv2json_small.py`: 元データのCSVをLeaflet用にJSONとして書き出す
- `summarize_progress.py`: 地域別/全体の完了率をJSONとして書き出す
- `summarize_progress_absolute.py`: 地域別/全体の未貼り付け掲示板数をJSONとして書き出す
- `main.sh`: 上記Pythonスクリプトを実行し、GitHubにデータをコミットし、Netlifyに公開する処理を一括で実行するシェルスクリプト (cronからの定期実行用)

```sh
# Download original CSV file
curl -sL "https://example.com/all.csv" > public/data/all.csv
# pip install -r requirements.txt
python csv2json_small.py <original_data.csv> <output_dir>
python summarize_progress.py <output_path>
```

```sh
# Run this regularly with cron
# If you're not in rush, you could run this on GitHub actions
bash path/to/tokyo2024-poster-map/main.sh
```

## 定期実行
`cron`でデータ更新を定期実行
```sh
# cronの設定を変更
crontab -e
```
```
# 5分ごとに定期実行する場合
*/5 * * * * path/to/tokyo2024-poster-map/main.sh
```

## 開発環境
1. 必要なパッケージをインストール:

   ```bash
   npm install
   ```

2. Next.js のローカル開発サーバーを起動:

   ```bash
   npm run dev
   ```

   サービスは [localhost:3000](http://localhost:3000/) でアクセス可能になります。

## 謝辞
本プロジェクトでは、以下のライブラリや公開データを使用させていただきました。この場を借りて開発者・コントリビューターの皆様に感謝申し上げます。
- [Leaflet](https://leafletjs.com/)
    - 地図上での可視化に使用
- [Bootstrap](https://getbootstrap.jp/)
    - トップページのメニューに使用 (CSSのみ)
- [Linked Open Addresses Japan](https://uedayou.net/loa/)
    - `/summary`ページで進捗を可視化する際に、各市区町村のポリゴンを利用
- [OpenStreetMap](https://www.openstreetmap.org/copyright), [国土地理院地図](https://maps.gsi.go.jp/development/ichiran.html), [Google Map](https://www.google.com/maps)
    - ベースマップとして利用
