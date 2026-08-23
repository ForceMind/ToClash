# 隐私声明

ToClash 专门用于在本地处理敏感的代理链接。

- 转换完全在浏览器中执行。
- 输入只保存在当前页面的临时内存中，ToClash 不会主动保存。
- 输入不会写入页面 URL、统计、日志、DOM ID 或 `data-*` 元数据。
- ToClash 没有后端转换接口，也不调用第三方转换服务。
- 复制和下载只会在用户主动点击对应按钮后执行。

静态托管平台在提供 HTML、CSS 和 JavaScript 文件时可能处理普通的网络请求元数据。这些请求不包含代理链接；ToClash 不会要求用户把敏感信息放入 URL。

用户需要自行保护剪贴板内容和下载的 YAML 文件。

English summary: conversion happens locally in browser memory. ToClash does not upload, log, persist, or place proxy links in URLs.
