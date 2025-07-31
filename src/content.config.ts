import { defineCollection, z } from 'astro:content';
// 定义博客文章集合，修正 date 类型处理
const postsCollection = defineCollection ({
schema: z.object ({
title: z.string (),
// 允许字符串类型的日期，自动转换为 Date 对象
date: z.string ().transform (str => new Date (str)),
description: z.string ().optional (), // 允许摘要为空
tags: z.array (z.string ()).optional (), // 允许标签为空
slug: z.string (), // 保持 slug 为必填
cover: z.string ().optional (),
}),
});

export const collections = {
posts: postsCollection,
};