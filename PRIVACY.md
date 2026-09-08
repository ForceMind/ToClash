# 隐私声明

ToClash 专门用于在本地处理敏感的代理链接。

- 转换完全在浏览器中执行。
- 代理链接及生成的 YAML 只保存在当前页面的临时内存中，不主动持久保存。
- 自定义直连 / 代理输入、内网 DNS 开关、域名后缀和 DNS 服务器自动保存于当前浏览器 LocalStorage；包括未完成的表单输入。数据未加密，同源脚本可访问。
- 可点击“重置已保存设置”删除本工具的保存项，或通过浏览器清除网站数据；换浏览器或站点不会自动同步。
- 服务预设、CGNAT、主题、语言和输出格式不持久保存。
- 输入不会写入页面 URL、统计、日志、DOM ID 或 `data-*` 元数据。
- ToClash 没有后端转换接口，也不调用第三方转换服务。
- 复制和下载只会在用户主动点击对应按钮后执行。

静态托管平台在提供 HTML、CSS 和 JavaScript 文件时可能处理普通的网络请求元数据。这些请求不包含代理链接；ToClash 不会要求用户把敏感信息放入 URL。

用户需要自行保护剪贴板内容和下载的 YAML 文件。

English summary: conversion happens locally in browser memory. ToClash does not upload, log, persist, or place proxy links in URLs.
