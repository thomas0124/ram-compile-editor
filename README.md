# RAM Editor

## 詳細
このリポジトリは、RAMで書かれたプログラムをWeb上で実行するためのものです。
このリポジトリでは、RAMの命令を解釈し、実行するためのスクリプトが含まれています。

## 技術スタック
Web framework
- Next.js
- TypeScript

UI
- tailwindcss
- lucide

CDN
- jsDelivr

PaaS
- Vercel

## 使用方法
1. リポジトリのクローン
```bash
git clone <このリポジトリのURL>
```
2. 依存関係のインストール
```bash
npm install
pnpm install
yarn install
bun install
```

3. 開発サーバーの起動
```bash
npm run dev
pnpm run dev
yarn dev
bun dev
```
4. ブラウザで `http://localhost:3000` にアクセス
5. エディタ上でRAMコードを記述し、__run__ もしくは __step__ を押すと、RAMコードが実行されます。
