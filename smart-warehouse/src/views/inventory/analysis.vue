<template>
  <div style="padding: 20px;">
    <el-card shadow="never" style="background: #1d1e1f; border: 1px solid #333; color: #fff; min-height: 400px;">
      <template #header>
        <span style="font-weight: bold;">🚧 功能开发中</span>
      </template>
      <div style="text-align: center; padding: 50px;">
        <el-empty description="该模块正在开发中，敬请期待..." />
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>