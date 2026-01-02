import antfu from '@antfu/eslint-config'

export default antfu({
  // 启用 TypeScript 支持
  typescript: true,

  // 启用 Vue 支持
  vue: {
    // 关闭 script 必须在 template 上面的规则
    overrides: {
      'vue/block-order': 'off',
      // 允许空标签不闭合
      'vue/html-end-tags': 'off',
    },
  },

  // 自定义样式规则
  stylistic: {
    indent: 2, // 2 空格缩进
    quotes: 'single', // 单引号
    semi: false, // 无分号
  },

  // 忽略的文件/目录
  ignores: [
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    'src/components/**',
    'src/lib/**',
    'src-tauri/**',
    'package.json',
    'package.json5',
    '*.md',
    '.github/workflows/**',
  ],
  rules: {
    'no-console': 'off',
    'prefer-const': 'off',
    'style/no-trailing-spaces': ['error', { skipBlankLines: true }],
  },
})
