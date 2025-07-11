const fs = require('fs');
const path = require('path');

// 应用补丁的函数
function applyPatch() {
  const postcssPath = path.join(__dirname, '../node_modules/postcss/lib/lazy-result.js');
  
  console.log('🔍 Checking for PostCSS file:', postcssPath);
  
  if (!fs.existsSync(postcssPath)) {
    console.log('❌ PostCSS not found, skipping patch application');
    return;
  }

  try {
    let content = fs.readFileSync(postcssPath, 'utf8');
    console.log('📖 PostCSS file loaded successfully');
    
    // 检查是否已经应用过补丁
    if (content.includes('visit.iterator = 0')) {
      console.log('✅ PostCSS patch already applied');
      return;
    }
    
    // 检查是否包含需要替换的代码
    if (!content.includes('visit.iterator = node.getIterator()')) {
      console.log('⚠️  Target code not found, PostCSS version might be different');
      console.log('🔍 Looking for alternative patterns...');
      
      // 尝试其他可能的模式
      const patterns = [
        'node.getIterator()',
        'getIterator()',
        'visit.iterator ='
      ];
      
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          console.log(`📝 Found pattern: ${pattern}`);
        }
      }
      return;
    }
    
    // 应用补丁
    const originalContent = content;
    content = content.replace(
      'visit.iterator = node.getIterator()',
      'visit.iterator = 0'
    );
    
    // 验证修改是否成功
    if (content === originalContent) {
      console.log('⚠️  No changes were made, pattern not found');
      return;
    }
    
    fs.writeFileSync(postcssPath, content, 'utf8');
    console.log('✅ PostCSS patch applied successfully');
    
    // 验证修改
    const verifyContent = fs.readFileSync(postcssPath, 'utf8');
    if (verifyContent.includes('visit.iterator = 0')) {
      console.log('✅ Patch verification successful');
    } else {
      console.log('❌ Patch verification failed');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply PostCSS patch:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// 运行补丁应用
console.log('🚀 Starting PostCSS patch application...');
applyPatch();
console.log('🏁 Patch application completed'); 