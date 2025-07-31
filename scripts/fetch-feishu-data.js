import fs from 'fs'; import path from 'path'; import { Client } from '@larksuiteoapi/node-sdk'; import dotenv from 'dotenv';dotenv.config();const client = new Client({
appId: process.env.FEISHU_APP_ID,
appSecret: process.env.FEISHU_APP_SECRET,
});const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
if (!fs.existsSync(postsDir)) {
fs.mkdirSync(postsDir, { recursive: true });
}/**从飞书获取表格数据
*/
async function fetchTableData () {
try {
const response = await client.bitable.v1.appTableRecord.list ({
path: {
app_token: process.env.FEISHU_APP_TOKEN,
table_id: process.env.FEISHU_TABLE_ID,
},
params: {
page_size: 100,
},
});return response.data.items;
} catch (error) {
console.error (' 获取表格数据失败:', error);
throw error;
}
}/**转换飞书富文本为 Markdown
*/
function richtextToMarkdown (richtext) {
if (!richtext || !Array.isArray (richtext)) return '';let markdown = '';richtext.forEach(block => {
switch (block.type) {
case 'paragraph':
markdown += ${block.text}\n\n;
break;
case 'heading':
markdown += ${'#'.repeat(block.level)} ${block.text}\n\n;
break;
case 'bulleted_list':
case 'numbered_list':
markdown += - ${block.text}\n;
break;
case 'image':
markdown += ![${block.alt_text || '图片'}](${block.url})\n\n;
break;
case 'code':
markdown += \``\({block.language || ''}\n\){block.text}\n```\n\n; break; default: markdown += ${block.text || ''}\n\n`;
}
});return markdown;
}/**生成默认 slug（当飞书表格中未提供时）
*/
function generateSlug (title) {
return title
.toLowerCase ()
.replace (/[^a-z0-9]+/g, '-')
.replace (/(^-|-$)/g, '');
}/**保存文章数据为 Markdown 文件
*/
function savePosts (items) {
items.forEach (item => {
const fields = item.fields;// 验证并处理必要字段
const title = fields. 标题 || 未命名文章-${Date.now()};
// 确保 slug 存在（如果飞书没有提供则自动生成）
const slug = fields.slug || generateSlug (title);
// 确保日期格式正确（飞书日期可能是 ISO 字符串）
const date = fields. 发布日期？new Date (fields. 发布日期).toISOString () : new Date ().toISOString ();// 跳过没有内容的记录
if (!fields. 内容) {
console.log (跳过无内容的记录: ${slug});
return;
}// 转换富文本内容为 Markdown
const content = richtextToMarkdown (fields. 内容);// 构建 Frontmatter（确保与 Schema 匹配）
const frontmatter = {
title: title,
date: date, // 存储为 ISO 格式字符串，后续会转换为 Date
description: fields. 摘要 || '',
tags: fields. 标签 || [],
slug: slug, // 确保 slug 存在
cover: fields. 封面图？.[0]?.url || '',
};// 构建 Markdown 内容
const markdownContent = --- ${Object.entries(frontmatter) .map(([key, value]) => { if (Array.isArray(value)) { return \({key}: [\){value.map(v => "${v}").join(', ')}]; } return \({key}: "\){value}"`;
})
.join('\n')}${content}`;// 保存文件
const filePath = path.join (postsDir, ${slug}.md);
fs.writeFileSync(filePath, markdownContent, 'utf8');
console.log(已保存: ${filePath});
});
}/**主函数
*/
async function main () {
try {
console.log (' 从飞书获取数据...');
const items = await fetchTableData ();console.log(获取到 ${items.length} 条记录，开始处理...);
savePosts(items);console.log (' 数据同步完成！');
} catch (error) {
console.error (' 同步失败:', error);
process.exit (1);
}
}main();