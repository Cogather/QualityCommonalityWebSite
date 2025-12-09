<template>
  <router-view />
</template>

<style>
:root {
  --el-color-primary: #409EFF;
  --el-bg-color: #f5f7fa;
  --el-text-color-primary: #303133;
  --el-text-color-regular: #606266;
}

body {
  margin: 0;
  background-color: var(--el-bg-color);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  color: var(--el-text-color-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Global scrollbar styling if needed */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}
::-webkit-scrollbar-track {
  background: #f5f7fa;
}
</style>
