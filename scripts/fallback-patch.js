const fs = require('fs');
const path = require('path');

console.log('🔄 Running fallback patch script...');

function applyFallbackPatch() {
  const postcssPath = path.join(__dirname, '../node_modules/postcss/lib/lazy-result.js');
  
  if (!fs.existsSync(postcssPath)) {
    console.log('❌ PostCSS file not found');
    return false;
  }

  try {
    let content = fs.readFileSync(postcssPath, 'utf8');
    
    // 使用更宽松的匹配模式
    const patterns = [
      'visit.iterator = node.getIterator()',
      'visit.iterator=node.getIterator()',
      'visit.iterator = node.getIterator( )',
      'visit.iterator = node.getIterator();'
    ];
    
    let replaced = false;
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        content = content.replace(pattern, 'visit.iterator = 0');
        replaced = true;
        console.log(`✅ Replaced pattern: ${pattern}`);
        break;
      }
    }
    
    if (!replaced) {
      console.log('⚠️  No matching patterns found');
      return false;
    }
    
    fs.writeFileSync(postcssPath, content, 'utf8');
    console.log('✅ Fallback patch applied successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Fallback patch failed:', error.message);
    return false;
  }
}

// 运行备用补丁
const success = applyFallbackPatch();
if (success) {
  console.log('🎉 Fallback patch completed successfully');
} else {
  console.log('💥 Fallback patch failed');
  process.exit(1);
} 