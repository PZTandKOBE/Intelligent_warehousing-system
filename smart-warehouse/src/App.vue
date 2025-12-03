<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<style>
/* 简单的全局重置 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  background-color: #0b1120; /* 深空蓝背景，很显高级 */
  color: #fff;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
.app-container {
  height: 100%;
  width: 100%;
}
</style>