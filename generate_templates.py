# -*- coding: utf-8 -*-
"""
批量生成templates目录下的完整HTML页面
从根目录index.html中提取页面内容，组装成独立的完整页面
"""

import os
import re

# 页面配置
PAGES = {
    'outbound': {
        'title': '出库管理',
        'nav_index': 3,
        'loader': 'loadOutboundPage'
    },
    'transfer': {
        'title': '库存调拨',
        'nav_index': 4,
        'loader': 'loadTransferPage'
    },
    'warehouse': {
        'title': '仓库管理',
        'nav_index': 5,
        'loader': None
    },
    'supplier': {
        'title': '供应商管理',
        'nav_index': 6,
        'loader': None
    },
    'reports': {
        'title': '报表分析',
        'nav_index': 7,
        'loader': None
    },
    'settings': {
        'title': '系统设置',
        'nav_index': 8,
        'loader': None
    }
}

# HTML模板头部
HTML_HEAD = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} - 物品库存管理系统</title>
  <script src="https://res.gemcoder.com/js/reload.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          colors: {{
            primary: '#007AFF', secondary: '#5AC8FA', success: '#34C759', warning: '#FF9500', danger: '#FF3B30', info: '#5856D6',
            light: '#F5F7FA', dark: '#1D1D1F', 'gray-light': '#E5E5EA', 'gray-medium': '#C7C7CC', 'gray-dark': '#8E8E93'
          }},
          fontFamily: {{ sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'] }},
          boxShadow: {{ 'apple': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', 'apple-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }},
          borderRadius: {{ 'apple': '12px', 'apple-sm': '8px' }}
        }}
      }}
    }};
  </script>
  <style type="text/tailwindcss">
    @layer utilities {{
      .scrollbar-hide {{ -ms-overflow-style: none; scrollbar-width: none; }}
      .scrollbar-hide::-webkit-scrollbar {{ display: none; }}
      .backdrop-blur-apple {{ backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }}
    }}
  </style>
</head>
<body class="bg-light font-sans text-dark antialiased min-h-screen flex flex-col">
  <header class="bg-white/80 backdrop-blur-apple border-b border-gray-light sticky top-0 z-50">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="w-10 h-10 rounded-apple-sm bg-primary flex items-center justify-center text-white">
          <i class="fas fa-boxes text-xl"></i>
        </div>
        <h1 class="text-xl font-semibold tracking-tight">库存管理系统</h1>
      </div>
      <div class="hidden md:flex relative flex-1 max-w-md mx-8">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fas fa-search text-gray-dark"></i>
        </div>
        <input type="text" placeholder="搜索物品、类别或条形码..." class="w-full pl-10 pr-4 py-2 rounded-full bg-light border border-gray-light focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-sm" />
      </div>
      <div class="flex items-center space-x-4">
        <button class="relative p-2 rounded-full hover:bg-light transition-colors duration-200">
          <i class="fas fa-bell text-gray-dark"></i>
          <span class="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
        </button>
        <div class="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-medium">JD</div>
      </div>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <aside class="w-16 md:w-64 bg-white border-r border-gray-light flex flex-col transition-all duration-300 ease-in-out z-40">
      <nav class="flex-1 overflow-y-auto scrollbar-hide py-4">
        <ul class="space-y-1 px-2">
{nav_links}
        </ul>
      </nav>
    </aside>

    <main class="flex-1 overflow-y-auto bg-light p-4 md:p-6 scrollbar-hide">
{page_content}
    </main>
  </div>
  
  <script src="https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js"></script>
  <script src="../js/api-service.js"></script>
  <script>{loader_script}</script>
</body>
</html>'''

# 导航链接模板
NAV_LINKS = [
    ('index.html', 'fa-tachometer-alt', '仪表盘', 0),
    ('items.html', 'fa-box', '库存物品', 1),
    ('inbound.html', 'fa-shopping-cart', '入库管理', 2),
    ('outbound.html', 'fa-shipping-fast', '出库管理', 3),
    ('transfer.html', 'fa-exchange-alt', '库存调拨', 4),
    ('warehouse.html', 'fa-warehouse', '仓库管理', 5),
    ('supplier.html', 'fa-users', '供应商', 6),
    ('reports.html', 'fa-file-invoice', '报表分析', 7),
    ('settings.html', 'fa-cog', '系统设置', 8),
]

def generate_nav(active_index):
    """生成导航链接HTML"""
    nav_html = []
    for href, icon, text, idx in NAV_LINKS:
        if idx == active_index:
            nav_html.append(f'          <li><a href="{href}" class="flex items-center space-x-3 px-3 py-3 rounded-apple-sm bg-primary/10 text-primary group"><i class="fas {icon} text-xl w-6 text-center"></i><span class="hidden md:inline font-medium">{text}</span></a></li>')
        else:
            nav_html.append(f'          <li><a href="{href}" class="flex items-center space-x-3 px-3 py-3 rounded-apple-sm text-gray-dark hover:bg-light transition-colors duration-200 group"><i class="fas {icon} text-xl w-6 text-center"></i><span class="hidden md:inline">{text}</span></a></li>')
    return '\n'.join(nav_html)

def extract_page_content(index_html, page_id):
    """从index.html中提取指定页面的内容"""
    # 匹配 <div id="{page_id}-page"...>...</div>
    pattern = rf'<div id="{page_id}-page"[^>]*>(.*?)</div>\s*<!-- \[/MODULE\]'
    match = re.search(pattern, index_html, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None

def generate_page(page_name, config, index_content):
    """生成单个页面的HTML"""
    page_id = page_name
    page_content = extract_page_content(index_content, page_id)
    
    if not page_content:
        print(f"❌ 无法提取 {page_name} 页面内容")
        return None
    
    nav_html = generate_nav(config['nav_index'])
    loader_script = f"if (typeof {config['loader']} === 'function') {{ {config['loader']}(); }}" if config['loader'] else ""
    
    html = HTML_HEAD.format(
        title=config['title'],
        nav_links=nav_html,
        page_content=page_content,
        loader_script=loader_script
    )
    
    return html

def main():
    """主函数"""
    print("🚀 开始生成templates页面...")
    
    # 读取根目录的index.html
    index_path = 'd:/wwwoot/库存管理系统/index.html'
    with open(index_path, 'r', encoding='utf-8') as f:
        index_content = f.read()
    
    print(f"✅ 已读取 {index_path}")
    
    # 生成每个页面
    success_count = 0
    for page_name, config in PAGES.items():
        html = generate_page(page_name, config, index_content)
        if html:
            output_path = f'd:/wwwoot/库存管理系统/templates/{page_name}.html'
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"✅ 已生成 {page_name}.html")
            success_count += 1
        else:
            print(f"❌ 生成 {page_name}.html 失败")
    
    print(f"\n🎉 完成！成功生成 {success_count}/{len(PAGES)} 个页面")

if __name__ == '__main__':
    main()
