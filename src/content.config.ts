import { defineCollection, z } from 'astro:content';
// 定义博客文章集合
const postsCollection = defineCollection ({
schema: z.object ({
title: z.string (),
date: z.date (),
description: z.string (),
tags: z.array (z.string ()),
slug: z.string (),
cover: z.string ().optional (),
}),
});

// 导出所有集合
export const collections = {
posts: postsCollection,
};