<template>
  <!-- 120ms 淡入：消除首次进入页面时懒加载路由组件的白屏空档 -->
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
/* 全局背景交给 src/style.css 的 token（body 背景 = var(--lwg-paper)），
   此处不再写具体色值。 */
</style>
