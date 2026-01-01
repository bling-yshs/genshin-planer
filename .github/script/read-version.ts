/**
 * 读取 tauri.conf.json5 中的版本号
 *
 * 使用方式: npx tsx read-version.ts
 *
 * 输出: 版本号 (例如: 0.0.1)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSON5 from 'json5'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function main() {
  const tauriConfigPath = path.resolve(__dirname, '../../src-tauri/tauri.conf.json5')

  if (!fs.existsSync(tauriConfigPath)) {
    throw new Error(`配置文件不存在: ${tauriConfigPath}`)
  }

  const content = fs.readFileSync(tauriConfigPath, 'utf-8')
  const config = JSON5.parse(content)

  if (!config.version) {
    throw new Error('tauri.conf.json5 中未找到 version 字段')
  }

  // 直接输出版本号，供 CI 使用
  console.log(config.version)
}

main()
