import fs from 'fs';
import path from 'path';
import { Client } from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化飞书客户端
const client = new Client({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
});

// 确保posts目录存在
const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

/**
 * 从飞书获取表格数据
 */
async function fetchTableData() {
  try {
    const response = await client.bitable.v1.appTableRecord.list({
      path: {
        app_token: process.env.FEISHU_APP_TOKEN,
        table_id: process.env.FEISHU_TABLE_ID,
      },
      params: {
        page_size: 100, // 一次获取100条记录
      },
    });
    
    return response.data.items;
  } catch (error) {
    console.error('获取表格数据失败:', error);
    throw error;
  }
}

/**
 * 转换飞书富文本为Markdown
 */
function richtextToMarkdown(richtext) {
  if (!richtext || !Array.isArray(richtext)) return '';
  
  let markdown = '';
  
  richtext.forEach(block => {
    switch (block.type) {
      case 'paragraph':
        markdown += `${block.text}\n\n`;
        break;
      case 'heading':
        markdown += `${'#'.repeat(block.level)} ${block.text}\n\n`;
        break;
      case 'bulleted_list':
      case 'numbered_list':
        markdown += `- ${block.text}\n`;
        break;
      case 'image':
        markdown += `![${block.alt_text || '图片'}](${block.url})\n\n`;
        break;
      case 'code':
        markdown += `\`\`\`${block.language || ''}\n${block.text}\n\`\`\`\n\n`;
        break;
      default:
        markdown += `${block.text || ''}\n\n`;
    }
  });
  
  return markdown;
}

/**
 * 保存文章数据为Markdown文件
 */
function savePosts(items) {
  items.forEach(item => {
    const fields = item.fields;
    
    // 跳过没有必要字段的记录
    if (!fields.slug || !fields.标题 || !fields.内容) {
      console.log('跳过不完整的记录:', fields.slug);
      return;
    }
    
    // 转换富文本内容为Markdown
    const content = richtextToMarkdown(fields.内容);
    
    // 构建Frontmatter
    const frontmatter = {
      title: fields.标题,
      date: fields.发布日期,
      description: fields.摘要 || '',
      tags: fields.标签 || [],
      slug: fields.slug,
      cover: fields.封面图?.[0]?.url || '',
    };
    
    // 构建Markdown内容
    const markdownContent = `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
    }
    return `${key}: "${value}"`;
  })
  .join('\n')}
---

${content}`;
    
    // 保存文件
    const filePath = path.join(postsDir, `${fields.slug}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    console.log(`已保存: ${filePath}`);
  });
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('从飞书获取数据...');
    const items = await fetchTableData();
    
    console.log(`获取到 ${items.length} 条记录，开始处理...`);
    savePosts(items);
    
    console.log('数据同步完成！');
  } catch (error) {
    console.error('同步失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();
    