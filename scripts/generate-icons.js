/**
 * EnglishVibe - PWA 图标生成脚本
 * 使用 Node.js canvas 生成 PNG 图标
 * 
 * 使用方法:
 * 1. 安装依赖: npm install canvas
 * 2. 运行脚本: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// 尝试加载 canvas 模块
let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.log('canvas 模块未安装。请运行: npm install canvas');
  console.log('');
  console.log('或者使用浏览器方式:');
  console.log('1. 在浏览器中打开 generate-icons.html');
  console.log('2. 点击"下载全部图标"按钮');
  console.log('3. 将下载的文件放入 assets/icons/ 目录');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'assets', 'icons');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function drawIcon(canvas, size) {
  const ctx = canvas.getContext('2d');
  const radius = size * 0.2;
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#7D93CD');
  gradient.addColorStop(1, '#6078B0');
  
  // 绘制圆角矩形背景
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 绘制书本 emoji (使用文字代替)
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📚', size / 2, size * 0.35);
  
  // 绘制 "EV" 文字
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.25}px Arial`;
  ctx.fillText('EV', size / 2, size * 0.65);
  
  // 绘制 "EnglishVibe" 文字（仅大尺寸）
  if (size >= 192) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${size * 0.08}px Arial`;
    ctx.fillText('EnglishVibe', size / 2, size * 0.85);
  }
}

console.log('正在生成 PWA 图标...\n');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  drawIcon(canvas, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(outputDir, `icon-${size}.png`);
  
  fs.writeFileSync(filePath, buffer);
  console.log(`✓ 生成: icon-${size}.png`);
});

console.log('\n✅ 所有图标生成完成！');
console.log(`📁 输出目录: ${outputDir}`);

