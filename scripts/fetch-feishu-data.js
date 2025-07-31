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
}/**转换飞书富文本为 Markdown（修正模板字符串语法）
*/
function richtextToMarkdown (richtext) {
if (!richtext || !Array.isArray (richtext)) return '';let markdown = '';richtext.forEach(block => {
switch (block.type) {
case 'paragraph':
markdown += ${block.text}\n\n; // 正确使用反引号
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
}/**生成默认 slug
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
const fields = item.fields;const title = fields. 标题 || 未命名文章-${Date.now()};
const slug = fields.slug || generateSlug (title);
const date = fields. 发布日期？new Date (fields. 发布日期).toISOString () : new Date ().toISOString ();if (!fields. 内容) {
console.log (跳过无内容的记录: ${slug});
return;
}const content = richtextToMarkdown (fields. 内容);const frontmatter = {
title: title,
date: date,
description: fields. 摘要 || '',
tags: fields. 标签 || [],
slug: slug,
cover: fields. 封面图？.[0]?.url || '',
};// 构建 Markdown 内容（确保所有模板字符串用反引号）
const markdownContent = --- ${Object.entries(frontmatter) .map(([key, value]) => { if (Array.isArray(value)) { return \({key}: [\){value.map(v => "${v}").join(', ')}]; } return \({key}: "\){value}"`;
})
.join('\n')}${content}`; // 正确使用反引号const filePath = path.join(postsDir, ${slug}.md);
fs.writeFileSync(filePath, markdownContent, 'utf8');
console.log(已保存: ${filePath});
});
}/**主函数
*/
async function main () {
try {
console.log (' 清理旧的文章文件...');
if (fs.existsSync (postsDir)) {
const files = fs.readdirSync (postsDir);
for (const file of files) {
if (file.endsWith ('.md')) {
fs.unlinkSync (path.join (postsDir, file));
}
}
}console.log (' 从飞书获取数据...');
const items = await fetchTableData ();console.log(获取到 ${items.length} 条记录，开始处理...);
savePosts(items);console.log (' 数据同步完成！');
} catch (error) {
console.error (' 同步失败:', error);
process.exit (1);
}
}main();