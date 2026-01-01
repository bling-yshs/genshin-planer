# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tauri v2 desktop application for Genshin Impact material planning. It uses Vue 3 frontend with a Rust backend, allowing users to log in via miHoYo QR code and calculate character/weapon upgrade materials.

## Architecture

### Frontend (Vue 3 + TypeScript)
- **Entry**: `src/main.ts` - Sets up Vue app with Pinia (persisted state)
- **Main UI**: `src/App.vue` - Single-page app with material planning interface
- **State Management**: `src/store/store.ts` - Pinia stores for auth (`useAuthStore`) and user data
- **API Layer**: `src/service/MHYService.ts` - All miHoYo API interactions (QR login, character/weapon lists, material calculations)
- **UI Components**: `src/components` - shadcn/vue-style components (Button, Card, Dialog, etc.) built on reka-ui

### Backend (Rust/Tauri)
- **Entry**: `src-tauri/src/main.rs` - Tauri app setup with plugins (fs, http, window-state)
- **Config**: `src-tauri/tauri.conf.json5` - Tauri configuration (JSON5 format)
- **Plugins**: tauri-plugin-http (with unsafe-headers for miHoYo API), tauri-plugin-fs, tauri-plugin-window-state

### Key Data Flow
1. User scans QR code via `fetchMHYLoginQRCode()` / `fetchMHYLoginResult()`
2. Auth tokens stored in Pinia (`useAuthStore.gameTokens`)
3. Material calculation via `fetchBatchCompute()` / `fetchBatchComputeWeapons()`
4. Results displayed in resizable panel layout with cultivation plan management

### HTTP Headers
`src/entity/HttpHeaderManager.ts` manages device fingerprinting and miHoYo-specific headers required for API authentication.

## Tech Stack
- **Frontend**: Vue 3.5, Vite 8 (beta), TypeScript, Tailwind CSS 4, Pinia 3
- **Backend**: Tauri 2, Rust
- **Package Manager**: pnpm (enforced via preinstall hook)
- **Config Format**: JSON5 for both `package.json5` and `tauri.conf.json5`

## Path Aliases
- `@/` maps to `src/` directory

## 项目规范
- 定义函数请使用 async function 而不是箭头函数
- 如果函数内容是远程调用，请使用 fetchXXX 的方式命名
- 永远使用 tailwind4，不允许使用传统 css
- 不允许使用 npm，只能用 pnpm 以及其对应的 pnpx
- 项目的基本组件是 shadcn-vue，安装新的组件请使用 context7 mcp，并使用 pnpx shadcn-vue@latest add button 类似的命令
- 不要尝试在 rust 里添加函数，一切都可以用前端代码和 tauri api 完成
- 在完全修改好代码以后，你必须运行 `pnpm lint` 来检查代码是否符合规范
